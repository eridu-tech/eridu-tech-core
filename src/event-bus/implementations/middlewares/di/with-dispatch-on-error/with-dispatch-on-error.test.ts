import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { registerWithDispatchOnError } from "@/event-bus/implementations/middlewares/di/with-dispatch-on-error/with-dispatch-on-error.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { IEventDispatcher } from "@/event-bus/contracts/_module.js";
import type { WithDispatchOnErrorPayloadSettings } from "@/event-bus/implementations/middlewares/with-dispatch-on-error-factory/with-dispatch-on-error-factory.js";

describe("function: registerWithDispatchOnError", () => {
    const EVENT_DISPATCHER = genericToken<IEventDispatcher>("IEventDispatcher");

    let container: IContainer;
    let adapter: NoOpEventBusAdapter;
    let eventDispatcher: EventBus;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        adapter = new NoOpEventBusAdapter();
        eventDispatcher = new EventBus({ adapter });
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
        container.registerValue({
            token: EVENT_DISPATCHER,
            value: eventDispatcher,
        });
        await container.init();
    });

    test("Should resolve the event dispatcher token and dispatch the event when the wrapped function throws", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");

        const payload = vi.fn(
            (
                settings: WithDispatchOnErrorPayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const innerFn = vi.fn((_userId: string): Promise<string> => {
            throw new Error("boom");
        });
        const wrapped = use(
            innerFn,
            registerWithDispatchOnError(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.error",
                payload,
            }),
        );

        await expect(wrapped("42")).rejects.toThrow("boom");

        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.error", {
            userId: "42",
        });
    });
    test("Should re-throw the error thrown by the wrapped function", async () => {
        const innerFn = vi.fn((): Promise<string> => {
            throw new Error("critical failure");
        });
        const wrapped = use(
            innerFn,
            registerWithDispatchOnError(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.error",
                payload: () => ({ userId: "42" }),
            }),
        );

        await expect(wrapped()).rejects.toThrow("critical failure");
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        const innerFn = vi.fn((): Promise<void> => Promise.resolve());
        const wrapped = use(
            innerFn,
            registerWithDispatchOnError(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.error",
                payload: () => ({ userId: "42" }),
            }),
        );

        await wrapped();
        await wrapped();

        expect(spy).toHaveBeenCalledTimes(2);
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            registerWithDispatchOnError(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.error",
                payload: () => ({ userId: "42" }),
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<IEventDispatcher>(
            "IUnregisteredEventDispatcher",
        );

        const innerFn = vi.fn((): Promise<void> => Promise.resolve());
        const wrapped = use(
            innerFn,
            registerWithDispatchOnError(
                container,
                unregisteredToken,
            )({
                type: "user.error",
                payload: () => ({ userId: "42" }),
            }),
        );

        await expect(wrapped()).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
