import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/no-op-cache-adapter/no-op-cache-adapter.js";
import { CacheResolver } from "@/cache/implementations/derivables/_module-exports.js";
import { ProxyCacheResolver } from "@/cache/implementations/derivables/di/proxy-cache-resolver/proxy-cache-resolver.js";
import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

import type { Mock } from "vitest";

import type {
    ICacheResolver,
    ICache,
    ICacheAdapter,
} from "@/cache/contracts/_module-exports.js";

describe("class: ProxyCacheResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let cache: ICacheResolver<Adapters> & ICache;
    let container: Container;
    let get1: Mock<ICacheAdapter["get"]>;
    let get2: Mock<ICacheAdapter["get"]>;

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

            const adapter1 = new NoOpCacheAdapter();
            get1 = vi.spyOn(adapter1, "get");

            const adapter2 = new NoOpCacheAdapter();
            get2 = vi.spyOn(adapter2, "get");

            container.registerFactory({
                token: CacheResolver,
                factory: () => {
                    return new CacheResolver<Adapters>({
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
            cache = new ProxyCacheResolver<Adapters>({
                container,
                resolverToken: CacheResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await cache.get(key);

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await cache.use("adapter1").get(key);

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await cache.use("adapter2").get(key);

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get1).not.toHaveBeenCalled();
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

            const adapter1 = new NoOpCacheAdapter();
            get1 = vi.spyOn(adapter1, "get");

            const adapter2 = new NoOpCacheAdapter();
            get2 = vi.spyOn(adapter2, "get");

            container.registerFactory({
                token: CacheResolver,
                factory: () => {
                    return new CacheResolver<Adapters>({
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
            cache = new ProxyCacheResolver<Adapters>({
                container,
                resolverToken: CacheResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await cache.get(key);

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await cache.use("adapter1").get(key);

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await cache.use("adapter2").get(key);

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get1).not.toHaveBeenCalled();
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

            const adapter1 = new NoOpCacheAdapter();
            get1 = vi.spyOn(adapter1, "get");

            const adapter2 = new NoOpCacheAdapter();
            get2 = vi.spyOn(adapter2, "get");

            container.registerFactory({
                token: CacheResolver,
                factory: () => {
                    return new CacheResolver<Adapters>({
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
            cache = new ProxyCacheResolver<Adapters>({
                container,
                resolverToken: CacheResolver,
            });

            await container.init();
        });
        test("Default adapter:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await cache.get(key);
                },
            });

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await cache.use("adapter1").get(key);
                },
            });

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await cache.use("adapter2").get(key);
                },
            });

            const args: Parameters<ICacheAdapter["get"]> = [key];

            expect(get2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(get1).not.toHaveBeenCalled();
        });
    });
});
