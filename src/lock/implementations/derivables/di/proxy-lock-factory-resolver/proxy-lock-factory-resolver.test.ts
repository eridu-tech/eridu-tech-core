import { beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { MemoryLockAdapter } from "@/lock/implementations/adapters/memory-lock-adapter/_module-exports.js";
import { LockFactoryResolver } from "@/lock/implementations/derivables/_module-exports.js";
import { ProxyLockFactoryResolver } from "@/lock/implementations/derivables/di/proxy-lock-factory-resolver/proxy-lock-factory-resolver.js";
import { lockFactorySerdeTestSuite } from "@/lock/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";

import type { Mock } from "vitest";

import type {
    ILockAdapter,
    ILockFactory,
    ILockFactoryResolver,
} from "@/lock/contracts/_module-exports.js";
import type { IFlexibleSerde } from "@/serde/contracts/_module-exports.js";

describe("class: ProxyLockFactoryResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let lockFactory: ILockFactoryResolver<Adapters> & ILockFactory;
    let container: Container;
    let acquire1: Mock<ILockAdapter["acquire"]>;
    let acquire2: Mock<ILockAdapter["acquire"]>;
    let serde: IFlexibleSerde;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const adapter1 = new MemoryLockAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new MemoryLockAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            serde = new SuperJsonSerde();
            container.registerFactory({
                token: LockFactoryResolver,
                factory: () => {
                    return new LockFactoryResolver<Adapters>({
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
            lockFactory = new ProxyLockFactoryResolver<Adapters>({
                container,
                resolverToken: LockFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            const lockId = "1";
            await lockFactory.create(key, { lockId, ttl: null }).acquire();

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            const lockId = "1";
            await lockFactory
                .use("adapter1")
                .create(key, { lockId, ttl: null })
                .acquire();

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            const lockId = "1";
            await lockFactory
                .use("adapter2")
                .create(key, { lockId, ttl: null })
                .acquire();

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire1).not.toHaveBeenCalled();
        });

        lockFactorySerdeTestSuite({
            createLockFactory: () => {
                return {
                    lockFactory,
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

            const adapter1 = new MemoryLockAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new MemoryLockAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            container.registerFactory({
                token: LockFactoryResolver,
                factory: async () => {
                    const factory = new LockFactoryResolver<Adapters>({
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
            lockFactory = new ProxyLockFactoryResolver<Adapters>({
                container,
                resolverToken: LockFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            const lockId = "1";
            await lockFactory.create(key, { lockId, ttl: null }).acquire();

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            const lockId = "1";
            await lockFactory
                .use("adapter1")
                .create(key, { lockId, ttl: null })
                .acquire();

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            const lockId = "1";
            await lockFactory
                .use("adapter2")
                .create(key, { lockId, ttl: null })
                .acquire();

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire1).not.toHaveBeenCalled();
        });
    });
    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const adapter1 = new MemoryLockAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new MemoryLockAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            container.registerFactory({
                token: LockFactoryResolver,
                factory: async () => {
                    const factory = new LockFactoryResolver<Adapters>({
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
            lockFactory = new ProxyLockFactoryResolver<Adapters>({
                container,
                resolverToken: LockFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            const lockId = "1";
            await container.run({
                scope: async () => {
                    await lockFactory
                        .create(key, { lockId, ttl: null })
                        .acquire();
                },
            });

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            const lockId = "1";
            await container.run({
                scope: async () => {
                    await lockFactory
                        .use("adapter1")
                        .create(key, { lockId, ttl: null })
                        .acquire();
                },
            });

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            const lockId = "1";
            await container.run({
                scope: async () => {
                    await lockFactory
                        .use("adapter2")
                        .create(key, { lockId, ttl: null })
                        .acquire();
                },
            });

            const args: Parameters<ILockAdapter["acquire"]> = [
                key,
                lockId,
                null,
            ];

            expect(acquire2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire1).not.toHaveBeenCalled();
        });
    });
});
