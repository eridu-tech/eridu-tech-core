import { beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { MemorySemaphoreAdapter } from "@/semaphore/implementations/adapters/memory-semaphore-adapter/_module-exports.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/no-op-semaphore-adapter/no-op-semaphore-adapter.js";
import { SemaphoreFactoryResolver } from "@/semaphore/implementations/derivables/_module-exports.js";
import { ProxySemaphoreFactoryResolver } from "@/semaphore/implementations/derivables/di/proxy-semaphore-factory-resolver/proxy-semaphore-factory-resolver.js";
import { semaphoreFactorySerdeTestSuite } from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";

import type { Mock } from "vitest";

import type {
    ISemaphoreAdapter,
    ISemaphoreFactory,
    ISemaphoreFactoryResolver,
} from "@/semaphore/contracts/_module-exports.js";
import type { IFlexibleSerde } from "@/serde/contracts/_module-exports.js";

describe("class: ProxySemaphoreFactoryResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let semaphoreFactory: ISemaphoreFactoryResolver<Adapters> &
        ISemaphoreFactory;
    let container: Container;
    let acquire1: Mock<ISemaphoreAdapter["acquire"]>;
    let acquire2: Mock<ISemaphoreAdapter["acquire"]>;
    let serde: IFlexibleSerde;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const adapter1 = new MemorySemaphoreAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new MemorySemaphoreAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            serde = new SuperJsonSerde();
            container.registerFactory({
                token: SemaphoreFactoryResolver,
                factory: () => {
                    return new SemaphoreFactoryResolver<Adapters>({
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
            semaphoreFactory = new ProxySemaphoreFactoryResolver<Adapters>({
                container,
                resolverToken: SemaphoreFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await semaphoreFactory
                .create(key, { limit, slotId, ttl: null })
                .acquire();

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await semaphoreFactory
                .use("adapter1")
                .create(key, { limit, slotId, ttl: null })
                .acquire();

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await semaphoreFactory
                .use("adapter2")
                .create(key, { limit, slotId, ttl: null })
                .acquire();

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire1).not.toHaveBeenCalled();
        });

        semaphoreFactorySerdeTestSuite({
            createSemaphoreFactory: () => {
                return {
                    semaphoreFactory,
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

            const adapter1 = new NoOpSemaphoreAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new NoOpSemaphoreAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            container.registerFactory({
                token: SemaphoreFactoryResolver,
                factory: async () => {
                    const factory = new SemaphoreFactoryResolver<Adapters>({
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
            semaphoreFactory = new ProxySemaphoreFactoryResolver<Adapters>({
                container,
                resolverToken: SemaphoreFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await semaphoreFactory
                .create(key, { limit, slotId, ttl: null })
                .acquire();

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await semaphoreFactory
                .use("adapter1")
                .create(key, { limit, slotId, ttl: null })
                .acquire();

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await semaphoreFactory
                .use("adapter2")
                .create(key, { limit, slotId, ttl: null })
                .acquire();

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire1).not.toHaveBeenCalled();
        });
    });
    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const adapter1 = new NoOpSemaphoreAdapter();
            acquire1 = vi.spyOn(adapter1, "acquire");

            const adapter2 = new NoOpSemaphoreAdapter();
            acquire2 = vi.spyOn(adapter2, "acquire");

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });
            container.registerFactory({
                token: SemaphoreFactoryResolver,
                factory: async () => {
                    const factory = new SemaphoreFactoryResolver<Adapters>({
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
            semaphoreFactory = new ProxySemaphoreFactoryResolver<Adapters>({
                container,
                resolverToken: SemaphoreFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await container.run({
                scope: async () => {
                    await semaphoreFactory
                        .create(key, { limit, slotId, ttl: null })
                        .acquire();
                },
            });

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await container.run({
                scope: async () => {
                    await semaphoreFactory
                        .use("adapter1")
                        .create(key, { limit, slotId, ttl: null })
                        .acquire();
                },
            });

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            const slotId = "1";
            const limit = 2;
            await container.run({
                scope: async () => {
                    await semaphoreFactory
                        .use("adapter2")
                        .create(key, { limit, slotId, ttl: null })
                        .acquire();
                },
            });

            const args: Parameters<ISemaphoreAdapter["acquire"]> = [
                {
                    key,
                    slotId,
                    limit,
                    ttl: null,
                },
            ];

            expect(acquire2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(acquire1).not.toHaveBeenCalled();
        });
    });
});
