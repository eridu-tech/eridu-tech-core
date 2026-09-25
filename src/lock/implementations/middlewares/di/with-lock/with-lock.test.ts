import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/_module.js";
import { LockFactory } from "@/lock/implementations/derivables/_module.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { registerWithLock } from "@/lock/implementations/middlewares/di/with-lock/with-lock.js";
import { use } from "@/middleware/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type {
    ILockFactory,
    LockFactoryCreateSettings,
} from "@/lock/contracts/_module.js";

describe("function: registerWithLock", () => {
    const LOCK_FACTORY = genericToken<ILockFactory>("ILockFactory");

    let container: IContainer;
    let lockFactory: LockFactory;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        lockFactory = new LockFactory({ adapter: new NoOpLockAdapter() });
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
        container.registerValue({ token: LOCK_FACTORY, value: lockFactory });
        await container.init();
    });

    test("Should resolve the lock factory token and call create with the key and settings", async () => {
        const spy = vi.spyOn(lockFactory, "create");

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        const settings: LockFactoryCreateSettings = {
            lockId: argValue,
            ttl: TimeSpan.fromSeconds(20),
        };
        await use(
            fn,
            registerWithLock(
                container,
                LOCK_FACTORY,
            )({
                ...settings,
                key: ([value]) => value,
                lockId: ([value]) => value,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledExactlyOnceWith(argValue, settings);
    });
    test("Should call Lock.runOrFail method", async () => {
        const spy = vi.spyOn(Lock.prototype, "runOrFail");

        async function fn(_value: string): Promise<void> {}
        await use(
            fn,
            registerWithLock(
                container,
                LOCK_FACTORY,
            )({
                key: ([value]) => value,
            }),
        )("value");

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithLock(
                container,
                LOCK_FACTORY,
            )({
                key: ([value]) => value,
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
            registerWithLock(
                container,
                LOCK_FACTORY,
            )({
                key: ([a, b]) => `${a}:${b}`,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<ILockFactory>(
            "IUnregisteredLockFactory",
        );

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithLock(
                container,
                unregisteredToken,
            )({
                key: ([value]) => value,
            }),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
