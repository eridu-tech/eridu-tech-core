import { beforeEach, describe, expect, test, vi } from "vitest";

import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/no-op-shared-lock-adapter/no-op-shared-lock-adapter.js";
import { SharedLockFactoryResolver } from "@/shared-lock/implementations/derivables/_module-exports.js";
import { sharedLockFactoryResolverDiFactory } from "@/shared-lock/implementations/derivables/di/shared-lock-factory-resolver-di-factory/shared-lock-factory-resolver-di-factory.js";

import type { Mock } from "vitest";

import type {
    ISharedLockAdapter,
    ISharedLockFactory,
    ISharedLockFactoryResolver,
} from "@/shared-lock/contracts/_module-exports.js";

describe("function: sharedLockFactoryResolverDiFactory", () => {
    type Adapters = "adapter1" | "adapter2";
    let sharedLockFactory: ISharedLockFactoryResolver<Adapters> &
        ISharedLockFactory;
    let acquireWriter1: Mock<ISharedLockAdapter["acquireWriter"]>;
    let acquireWriter2: Mock<ISharedLockAdapter["acquireWriter"]>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const container = new Container({
            executionContext,
        });

        const adapter1 = new NoOpSharedLockAdapter();
        acquireWriter1 = vi.spyOn(adapter1, "acquireWriter");

        const adapter2 = new NoOpSharedLockAdapter();
        acquireWriter2 = vi.spyOn(adapter2, "acquireWriter");

        const sharedLockFactoryResolver =
            new SharedLockFactoryResolver<Adapters>({
                adapters: {
                    adapter1,
                    adapter2,
                },
                defaultAdapter: "adapter1",
            });
        container.registerValue({
            token: SharedLockFactoryResolver,
            value: sharedLockFactoryResolver,
        });
        sharedLockFactory = sharedLockFactoryResolverDiFactory<Adapters>(
            container,
            SharedLockFactoryResolver,
        );

        await container.init();
    });

    test("Default adapter:", async () => {
        const key = "a";
        const lockId = "1";
        const limit = 2;
        await sharedLockFactory
            .create(key, { limit, lockId, ttl: null })
            .acquireWriter();

        const args: Parameters<ISharedLockAdapter["acquireWriter"]> = [
            key,
            lockId,
            null,
        ];

        expect(acquireWriter1).toHaveBeenCalledExactlyOnceWith(...args);
        expect(acquireWriter2).not.toHaveBeenCalled();
    });
    test("Adapter 1:", async () => {
        const key = "a";
        const lockId = "1";
        const limit = 2;
        await sharedLockFactory
            .use("adapter1")
            .create(key, { limit, lockId, ttl: null })
            .acquireWriter();

        const args: Parameters<ISharedLockAdapter["acquireWriter"]> = [
            key,
            lockId,
            null,
        ];

        expect(acquireWriter1).toHaveBeenCalledExactlyOnceWith(...args);
        expect(acquireWriter2).not.toHaveBeenCalled();
    });
    test("Adapter 2:", async () => {
        const key = "a";
        const lockId = "1";
        const limit = 2;
        await sharedLockFactory
            .use("adapter2")
            .create(key, { limit, lockId, ttl: null })
            .acquireWriter();

        const args: Parameters<ISharedLockAdapter["acquireWriter"]> = [
            key,
            lockId,
            null,
        ];

        expect(acquireWriter2).toHaveBeenCalledExactlyOnceWith(...args);
        expect(acquireWriter1).not.toHaveBeenCalled();
    });
});
