import { beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { MemorySharedLockAdapter } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module-exports.js";
import { SharedLockFactoryResolver } from "@/shared-lock/implementations/derivables/_module-exports.js";
import { ProxySharedLockFactoryResolver } from "@/shared-lock/implementations/derivables/di/proxy-shared-lock-factory-resolver/proxy-shared-lock-factory-resolver.js";
import { sharedLockFactorySerdeTestSuite } from "@/shared-lock/implementations/test-utilities/_module-exports.js";

import type { Mock } from "vitest";

import type { IFlexibleSerde } from "@/serde/contracts/flexible-serde.contract.js";
import type {
    ISharedLockAdapter,
    ISharedLockFactory,
    ISharedLockFactoryResolver,
} from "@/shared-lock/contracts/_module-exports.js";

describe("class: ProxySharedLockFactoryResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let sharedLockFactory: ISharedLockFactoryResolver<Adapters> &
        ISharedLockFactory;
    let container: Container;
    let acquireWriter1: Mock<ISharedLockAdapter["acquireWriter"]>;
    let acquireWriter2: Mock<ISharedLockAdapter["acquireWriter"]>;
    let serde: IFlexibleSerde;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const adapter1 = new MemorySharedLockAdapter();
            acquireWriter1 = vi.spyOn(adapter1, "acquireWriter");

            const adapter2 = new MemorySharedLockAdapter();
            acquireWriter2 = vi.spyOn(adapter2, "acquireWriter");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            serde = new SuperJsonSerde();
            container.registerFactory({
                token: SharedLockFactoryResolver,
                factory: () => {
                    return new SharedLockFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        serde,
                    });
                },
                onInit: async (factory) => {
                    await factory.init();
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            sharedLockFactory = new ProxySharedLockFactoryResolver<Adapters>({
                container,
                resolverToken: SharedLockFactoryResolver,
            });

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

        sharedLockFactorySerdeTestSuite({
            createSharedLockFactory: () => {
                return {
                    sharedLockFactory,
                    serde,
                };
            },
            beforeEach,
            describe,
            expect,
            test,
        });
    });
    describe("LIFETIME.TRANSIENT:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const adapter1 = new MemorySharedLockAdapter();
            acquireWriter1 = vi.spyOn(adapter1, "acquireWriter");

            const adapter2 = new MemorySharedLockAdapter();
            acquireWriter2 = vi.spyOn(adapter2, "acquireWriter");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            container.registerFactory({
                token: SharedLockFactoryResolver,
                factory: async () => {
                    const factory = new SharedLockFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                    await factory.init();
                    return factory;
                },
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            sharedLockFactory = new ProxySharedLockFactoryResolver<Adapters>({
                container,
                resolverToken: SharedLockFactoryResolver,
            });

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
    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const adapter1 = new MemorySharedLockAdapter();
            acquireWriter1 = vi.spyOn(adapter1, "acquireWriter");

            const adapter2 = new MemorySharedLockAdapter();
            acquireWriter2 = vi.spyOn(adapter2, "acquireWriter");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            container.registerFactory({
                token: SharedLockFactoryResolver,
                factory: async () => {
                    const factory = new SharedLockFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                    await factory.init();
                    return factory;
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            sharedLockFactory = new ProxySharedLockFactoryResolver<Adapters>({
                container,
                resolverToken: SharedLockFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            const lockId = "1";
            const limit = 2;
            await container.run({
                scope: async () => {
                    await sharedLockFactory
                        .create(key, { limit, lockId, ttl: null })
                        .acquireWriter();
                },
            });

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
            await container.run({
                scope: async () => {
                    await sharedLockFactory
                        .use("adapter1")
                        .create(key, { limit, lockId, ttl: null })
                        .acquireWriter();
                },
            });

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
            await container.run({
                scope: async () => {
                    await sharedLockFactory
                        .use("adapter2")
                        .create(key, { limit, lockId, ttl: null })
                        .acquireWriter();
                },
            });

            const args: Parameters<ISharedLockAdapter["acquireWriter"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquireWriter2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquireWriter1).not.toHaveBeenCalled();
        });
    });
});
