import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { SemaphoreFactory } from "@/semaphore/implementations/derivables/_module.js";
import { Semaphore } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { registerWithSemaphore } from "@/semaphore/implementations/middlewares/di/with-semaphore/with-semaphore.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type {
    ISemaphoreFactory,
    SemaphoreFactoryCreateSettings,
} from "@/semaphore/contracts/_module.js";

describe("function: registerWithSemaphore", () => {
    const SEMAPHORE_FACTORY =
        genericToken<ISemaphoreFactory>("ISemaphoreFactory");

    let container: IContainer;
    let semaphoreFactory: SemaphoreFactory;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        semaphoreFactory = new SemaphoreFactory({
            adapter: new NoOpSemaphoreAdapter(),
        });
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
        container.registerValue({
            token: SEMAPHORE_FACTORY,
            value: semaphoreFactory,
        });
        await container.init();
    });

    test("Should resolve the semaphore factory token and call create with the key and settings", async () => {
        const spy = vi.spyOn(semaphoreFactory, "create");

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        const settings: SemaphoreFactoryCreateSettings = {
            slotId: argValue,
            ttl: TimeSpan.fromSeconds(20),
            limit: 4,
        };
        await use(
            fn,
            registerWithSemaphore(
                container,
                SEMAPHORE_FACTORY,
            )({
                ...settings,
                key: ([value]) => value,
                slotId: ([value]) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledExactlyOnceWith(argValue, settings);
    });
    test("Should call Semaphore.runOrFail method", async () => {
        const spy = vi.spyOn(Semaphore.prototype, "runOrFail");

        async function fn(_value: string): Promise<void> {}
        await use(
            fn,
            registerWithSemaphore(
                container,
                SEMAPHORE_FACTORY,
            )({
                key: ([value]) => value,
                limit: 4,
            }),
        )("value");

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithSemaphore(
                container,
                SEMAPHORE_FACTORY,
            )({
                key: ([value]) => value,
                limit: 4,
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
            registerWithSemaphore(
                container,
                SEMAPHORE_FACTORY,
            )({
                key: ([a, b]) => `${a}:${b}`,
                limit: 4,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<ISemaphoreFactory>(
            "IUnregisteredSemaphoreFactory",
        );

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithSemaphore(
                container,
                unregisteredToken,
            )({
                key: ([value]) => value,
                limit: 4,
            }),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
