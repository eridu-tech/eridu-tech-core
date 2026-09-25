import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { registerWithDispatchAfter } from "@/event-bus/implementations/middlewares/di/with-dispatch-after/with-dispatch-after.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { IEventDispatcher } from "@/event-bus/contracts/_module.js";
import type { WithDispatchAfterPayloadSettings } from "@/event-bus/implementations/middlewares/with-dispatch-after-factory/with-dispatch-after-factory.js";

describe("function: registerWithDispatchAfter", () => {
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

    test("Should resolve the event dispatcher token and dispatch the event after the wrapped function resolves", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");

        const payload = vi.fn(
            (
                settings: WithDispatchAfterPayloadSettings<
                    [userId: string],
                    string
                >,
            ) => ({
                userId: `${settings.args[0]}-${settings.returnValue}`,
            }),
        );
        const innerFn = vi.fn((userId: string): Promise<string> =>
            Promise.resolve(`result-${userId}`),
        );
        const wrapped = use(
            innerFn,
            registerWithDispatchAfter(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped("u-7");

        expect(result).toBe("result-u-7");
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "u-7-result-u-7",
        });
    });
    test("Should dispatch the event after the wrapped function resolves", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");

        const innerFn = vi.fn((): Promise<void> => Promise.resolve());
        const wrapped = use(
            innerFn,
            registerWithDispatchAfter(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.created",
                payload: () => ({ userId: "42" }),
            }),
        );

        await wrapped();

        const dispatchOrder = dispatch.mock.invocationCallOrder[0] as number;
        const innerOrder = innerFn.mock.invocationCallOrder[0] as number;
        expect(innerOrder).toBeLessThan(dispatchOrder);
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        const innerFn = vi.fn((): Promise<void> => Promise.resolve());
        const wrapped = use(
            innerFn,
            registerWithDispatchAfter(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.created",
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
            registerWithDispatchAfter(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.created",
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
            registerWithDispatchAfter(
                container,
                unregisteredToken,
            )({
                type: "user.created",
                payload: () => ({ userId: "42" }),
            }),
        );

        await expect(wrapped()).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
