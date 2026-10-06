import { beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { MemoryLockAdapter } from "@/lock/implementations/adapters/memory-lock-adapter/_module-exports.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/no-op-lock-adapter/no-op-lock-adapter.js";
import { LockFactoryResolver } from "@/lock/implementations/derivables/_module-exports.js";
import { ProxyLockFactoryResolver } from "@/lock/implementations/derivables/di/proxy-lock-factory-resolver/proxy-lock-factory-resolver.js";
import { lockFactorySerdeTestSuite } from "@/lock/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module-exports.js";
import { Serde } from "@/serde/implementations/derivables/_module-exports.js";

import type { Mock } from "vitest";

import type {
    ILockAdapter,
    ILockFactory,
    ILockFactoryResolver,
} from "@/lock/contracts/_module-exports.js";

describe("class: ProxyLockFactoryResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let lockFactory: ILockFactoryResolver<Adapters> & ILockFactory;
    let container: Container;
    let acquire1: Mock<ILockAdapter["acquire"]>;
    let acquire2: Mock<ILockAdapter["acquire"]>;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpLockAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new NoOpLockAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            container.registerFactory({
                token: LockFactoryResolver,
                factory: () => {
                    return new LockFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            lockFactory = new ProxyLockFactoryResolver<Adapters>(
                container,
                LockFactoryResolver,
            );

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
            createLockFactory: async () => {
                const serde = new Serde(new SuperJsonSerdeAdapter());
                const executionContext = new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                );
                const serdeContainer = new Container({
                    executionContext,
                });
                const lockFactoryResolver = new LockFactoryResolver<Adapters>({
                    adapters: {
                        adapter1: new MemoryLockAdapter(),
                        adapter2: new MemoryLockAdapter(),
                    },
                    defaultAdapter: "adapter1",
                    serde,
                });
                serdeContainer.registerFactory({
                    token: LockFactoryResolver,
                    factory: () => {
                        return lockFactoryResolver;
                    },
                    deps: {},
                    lifetime: LIFETIME.SINGLETON,
                });
                const lockFactory_ = new ProxyLockFactoryResolver<Adapters>(
                    serdeContainer,
                    LockFactoryResolver,
                );
                await serdeContainer.init();
                return {
                    lockFactory: lockFactory_,
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

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpLockAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new NoOpLockAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            container.registerFactory({
                token: LockFactoryResolver,
                factory: () => {
                    return new LockFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                },
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            lockFactory = new ProxyLockFactoryResolver<Adapters>(
                container,
                LockFactoryResolver,
            );

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
            createLockFactory: async () => {
                const serde = new Serde(new SuperJsonSerdeAdapter());
                const executionContext = new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                );
                const serdeContainer = new Container({
                    executionContext,
                });
                const lockFactoryResolver = new LockFactoryResolver<Adapters>({
                    adapters: {
                        adapter1: new MemoryLockAdapter(),
                        adapter2: new MemoryLockAdapter(),
                    },
                    defaultAdapter: "adapter1",
                    serde,
                });
                serdeContainer.registerFactory({
                    token: LockFactoryResolver,
                    factory: () => {
                        return lockFactoryResolver;
                    },
                    deps: {},
                    lifetime: LIFETIME.TRANSIENT,
                });
                const lockFactory_ = new ProxyLockFactoryResolver<Adapters>(
                    serdeContainer,
                    LockFactoryResolver,
                );
                await serdeContainer.init();
                return {
                    lockFactory: lockFactory_,
                    serde,
                };
            },
            beforeEach,
            describe,
            expect,
            test,
        });
    });
    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpLockAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new NoOpLockAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            container.registerFactory({
                token: LockFactoryResolver,
                factory: () => {
                    return new LockFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            lockFactory = new ProxyLockFactoryResolver<Adapters>(
                container,
                LockFactoryResolver,
            );

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

        lockFactorySerdeTestSuite({
            createLockFactory: async () => {
                const serde = new Serde(new SuperJsonSerdeAdapter());
                const executionContext = new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                );
                const serdeContainer = new Container({
                    executionContext,
                });
                const lockFactoryResolver = new LockFactoryResolver<Adapters>({
                    adapters: {
                        adapter1: new MemoryLockAdapter(),
                        adapter2: new MemoryLockAdapter(),
                    },
                    defaultAdapter: "adapter1",
                    serde,
                });
                serdeContainer.registerFactory({
                    token: LockFactoryResolver,
                    factory: () => {
                        return lockFactoryResolver;
                    },
                    deps: {},
                    lifetime: LIFETIME.SCOPED,
                });
                const lockFactory_ = new ProxyLockFactoryResolver<Adapters>(
                    serdeContainer,
                    LockFactoryResolver,
                );
                await serdeContainer.init();
                return {
                    lockFactory: lockFactory_,
                    serde,
                };
            },
            beforeEach,
            describe,
            expect,
            test,
        });
    });
});
