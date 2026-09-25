import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/_module.js";
import { EventBus } from "@/event-bus/implementations/derivables/_module.js";
import { registerWithDispatchBefore } from "@/event-bus/implementations/middlewares/di/with-dispatch-before/with-dispatch-before.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { IEventDispatcher } from "@/event-bus/contracts/_module.js";
import type { WithDispatchBeforePayloadSettings } from "@/event-bus/implementations/middlewares/with-dispatch-before-factory/with-dispatch-before-factory.js";

describe("function: registerWithDispatchBefore", () => {
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

    test("Should resolve the event dispatcher token and dispatch the event before invoking the wrapped function", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");

        const payload = vi.fn(
            (
                settings: WithDispatchBeforePayloadSettings<[userId: string]>,
            ) => ({
                userId: settings.args[0],
            }),
        );
        const innerFn = vi.fn((_userId: string): Promise<string> =>
            Promise.resolve("ok"),
        );
        const wrapped = use(
            innerFn,
            registerWithDispatchBefore(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.created",
                payload,
            }),
        );

        const result = await wrapped("42");

        expect(result).toBe("ok");
        expect(dispatch).toHaveBeenCalledExactlyOnceWith("user.created", {
            userId: "42",
        });
    });
    test("Should dispatch the event before the wrapped function executes", async () => {
        const dispatch = vi.spyOn(adapter, "dispatch");

        const innerFn = vi.fn((_userId: string): Promise<void> =>
            Promise.resolve(),
        );
        const wrapped = use(
            innerFn,
            registerWithDispatchBefore(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.created",
                payload: ({ args }) => ({ userId: args[0] }),
            }),
        );

        await wrapped("42");

        const dispatchOrder = dispatch.mock.invocationCallOrder[0] as number;
        const innerOrder = innerFn.mock.invocationCallOrder[0] as number;
        expect(dispatchOrder).toBeLessThan(innerOrder);
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        const innerFn = vi.fn((_userId: string): Promise<void> =>
            Promise.resolve(),
        );
        const wrapped = use(
            innerFn,
            registerWithDispatchBefore(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.created",
                payload: ({ args }) => ({ userId: args[0] }),
            }),
        );

        await wrapped("a");
        await wrapped("b");

        expect(spy).toHaveBeenCalledTimes(2);
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            registerWithDispatchBefore(
                container,
                EVENT_DISPATCHER,
            )({
                type: "user.created",
                payload: ({ args }) => ({ value: args.join(":") }),
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<IEventDispatcher>(
            "IUnregisteredEventDispatcher",
        );

        const innerFn = vi.fn((_userId: string): Promise<void> =>
            Promise.resolve(),
        );
        const wrapped = use(
            innerFn,
            registerWithDispatchBefore(
                container,
                unregisteredToken,
            )({
                type: "user.created",
                payload: ({ args }) => ({ userId: args[0] }),
            }),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
