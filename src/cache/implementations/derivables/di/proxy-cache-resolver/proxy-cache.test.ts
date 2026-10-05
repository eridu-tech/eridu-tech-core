import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/no-op-cache-adapter/no-op-cache-adapter.js";
import { CacheResolver } from "@/cache/implementations/derivables/_module-exports.js";
import { ProxyCacheResolver } from "@/cache/implementations/derivables/di/proxy-cache-resolver/proxy-cache-resolver.js";
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
    let get1: Mock<ICacheAdapter["get"]>;
    let get2: Mock<ICacheAdapter["get"]>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const container = new Container({
            executionContext,
        });

        const adapter1 = new NoOpCacheAdapter();
        get1 = vi.spyOn(adapter1, "get");

        const adapter2 = new NoOpCacheAdapter();
        get2 = vi.spyOn(adapter2, "get");

        const cacheResolver = new CacheResolver<Adapters>({
            adapters: {
                adapter1,
                adapter2,
            },
            defaultAdapter: "adapter1",
        });
        container.registerValue({
            token: CacheResolver,
            value: cacheResolver,
        });
        cache = new ProxyCacheResolver<Adapters>(container, CacheResolver);

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
