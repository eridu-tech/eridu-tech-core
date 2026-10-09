import { beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { MemorySharedLockAdapter } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module-exports.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/no-op-shared-lock-adapter/no-op-shared-lock-adapter.js";
import { SharedLockFactoryResolver } from "@/shared-lock/implementations/derivables/_module-exports.js";
import { ProxySharedLockFactoryResolver } from "@/shared-lock/implementations/derivables/di/proxy-shared-lock-factory-resolver/proxy-shared-lock-factory-resolver.js";
import { sharedLockFactorySerdeTestSuite } from "@/shared-lock/implementations/test-utilities/_module-exports.js";

import type { Mock } from "vitest";

import type { Lifetime } from "@/di/contracts/_module-exports.js";
import type { ISerdeRegister } from "@/serde/contracts/_module-exports.js";
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

    type SharedLockFactoryContainerSettings = {
        adapter1: ISharedLockAdapter;
        adapter2: ISharedLockAdapter;
        lifetime: Lifetime;
        serde?: ISerdeRegister;
    };

    function createSharedLockFactoryContainer(
        settings: SharedLockFactoryContainerSettings,
    ): {
        container: Container;
        sharedLockFactory: ISharedLockFactoryResolver<Adapters> &
            ISharedLockFactory;
    } {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const createdContainer = new Container({
            executionContext,
        });
        createdContainer.registerFactory({
            token: SharedLockFactoryResolver,
            factory: () => {
                return new SharedLockFactoryResolver<Adapters>({
                    adapters: {
                        adapter1: settings.adapter1,
                        adapter2: settings.adapter2,
                    },
                    defaultAdapter: "adapter1",
                    serde: settings.serde,
                });
            },
            deps: {},
            lifetime: settings.lifetime,
        });
        const createdSharedLockFactory =
            new ProxySharedLockFactoryResolver<Adapters>({
                container: createdContainer,
                resolverToken: SharedLockFactoryResolver,
            });
        return {
            container: createdContainer,
            sharedLockFactory: createdSharedLockFactory,
        };
    }

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const adapter1 = new NoOpSharedLockAdapter();
            acquireWriter1 = vi.spyOn(adapter1, "acquireWriter");

            const adapter2 = new NoOpSharedLockAdapter();
            acquireWriter2 = vi.spyOn(adapter2, "acquireWriter");

            const created = createSharedLockFactoryContainer({
                adapter1,
                adapter2,
                lifetime: LIFETIME.SINGLETON,
            });
            container = created.container;
            sharedLockFactory = created.sharedLockFactory;

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
            createSharedLockFactory: async () => {
                const serde = new SuperJsonSerde();
                const created = createSharedLockFactoryContainer({
                    adapter1: new MemorySharedLockAdapter(),
                    adapter2: new MemorySharedLockAdapter(),
                    serde,
                    lifetime: LIFETIME.SINGLETON,
                });
                await created.container.init();
                return {
                    sharedLockFactory: created.sharedLockFactory,
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

            const adapter1 = new NoOpSharedLockAdapter();
            acquireWriter1 = vi.spyOn(adapter1, "acquireWriter");

            const adapter2 = new NoOpSharedLockAdapter();
            acquireWriter2 = vi.spyOn(adapter2, "acquireWriter");

            const created = createSharedLockFactoryContainer({
                adapter1,
                adapter2,
                lifetime: LIFETIME.TRANSIENT,
            });
            container = created.container;
            sharedLockFactory = created.sharedLockFactory;

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
            createSharedLockFactory: async () => {
                const serde = new SuperJsonSerde();
                const created = createSharedLockFactoryContainer({
                    adapter1: new MemorySharedLockAdapter(),
                    adapter2: new MemorySharedLockAdapter(),
                    serde,
                    lifetime: LIFETIME.TRANSIENT,
                });
                await created.container.init();
                return {
                    sharedLockFactory: created.sharedLockFactory,
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

            const adapter1 = new NoOpSharedLockAdapter();
            acquireWriter1 = vi.spyOn(adapter1, "acquireWriter");

            const adapter2 = new NoOpSharedLockAdapter();
            acquireWriter2 = vi.spyOn(adapter2, "acquireWriter");

            const created = createSharedLockFactoryContainer({
                adapter1,
                adapter2,
                lifetime: LIFETIME.SCOPED,
            });
            container = created.container;
            sharedLockFactory = created.sharedLockFactory;

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

        sharedLockFactorySerdeTestSuite({
            createSharedLockFactory: async () => {
                const serde = new SuperJsonSerde();
                const created = createSharedLockFactoryContainer({
                    adapter1: new MemorySharedLockAdapter(),
                    adapter2: new MemorySharedLockAdapter(),
                    serde,
                    lifetime: LIFETIME.SCOPED,
                });
                await created.container.init();
                return {
                    sharedLockFactory: created.sharedLockFactory,
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
