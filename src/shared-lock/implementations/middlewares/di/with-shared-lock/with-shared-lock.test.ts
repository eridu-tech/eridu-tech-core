import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/_module.js";
import { SharedLockFactory } from "@/shared-lock/implementations/derivables/_module.js";
import { SharedLock } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import { registerWithSharedLock } from "@/shared-lock/implementations/middlewares/di/with-shared-lock/with-shared-lock.js";
import { SHARED_LOCK_WHEN } from "@/shared-lock/implementations/middlewares/with-shared-lock-factory/with-shared-lock-factory.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type {
    ISharedLockFactory,
    SharedLockFactoryCreateSettings,
} from "@/shared-lock/contracts/_module.js";

describe("function: registerWithSharedLock", () => {
    const SHARED_LOCK_FACTORY =
        genericToken<ISharedLockFactory>("ISharedLockFactory");

    let container: IContainer;
    let sharedLockFactory: SharedLockFactory;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        sharedLockFactory = new SharedLockFactory({
            adapter: new NoOpSharedLockAdapter(),
        });
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
        container.registerValue({
            token: SHARED_LOCK_FACTORY,
            value: sharedLockFactory,
        });
        await container.init();
    });

    test("Should resolve the shared-lock factory token and call create with the key and settings", async () => {
        const spy = vi.spyOn(sharedLockFactory, "create");

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        const settings: SharedLockFactoryCreateSettings = {
            lockId: argValue,
            limit: 4,
            ttl: TimeSpan.fromSeconds(20),
        };
        await use(
            fn,
            registerWithSharedLock(
                container,
                SHARED_LOCK_FACTORY,
            )({
                ...settings,
                key: ([value]) => value,
                lockId: ([value]) => value,
                when: SHARED_LOCK_WHEN.WRITER,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledExactlyOnceWith(argValue, settings);
    });
    test("Should call SharedLock.runWriterOrFail method", async () => {
        const spy = vi.spyOn(SharedLock.prototype, "runWriterOrFail");

        async function fn(_value: string): Promise<void> {}
        await use(
            fn,
            registerWithSharedLock(
                container,
                SHARED_LOCK_FACTORY,
            )({
                key: ([value]) => value,
                limit: 4,
                when: SHARED_LOCK_WHEN.WRITER,
            }),
        )("value");

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should call SharedLock.runReaderOrFail method", async () => {
        const spy = vi.spyOn(SharedLock.prototype, "runReaderOrFail");

        async function fn(_value: string): Promise<void> {}
        await use(
            fn,
            registerWithSharedLock(
                container,
                SHARED_LOCK_FACTORY,
            )({
                key: ([value]) => value,
                limit: 4,
                when: SHARED_LOCK_WHEN.READER,
            }),
        )("value");

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithSharedLock(
                container,
                SHARED_LOCK_FACTORY,
            )({
                key: ([value]) => value,
                limit: 4,
                when: SHARED_LOCK_WHEN.WRITER,
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
            registerWithSharedLock(
                container,
                SHARED_LOCK_FACTORY,
            )({
                key: ([a, b]) => `${a}:${b}`,
                limit: 4,
                when: SHARED_LOCK_WHEN.READER,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<ISharedLockFactory>(
            "IUnregisteredSharedLockFactory",
        );

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithSharedLock(
                container,
                unregisteredToken,
            )({
                key: ([value]) => value,
                limit: 4,
                when: SHARED_LOCK_WHEN.WRITER,
            }),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
