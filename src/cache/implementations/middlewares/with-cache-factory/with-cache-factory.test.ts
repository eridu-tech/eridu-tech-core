import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/no-op-cache-adapter/_module-exports.js";
import {
    Cache,
    CacheResolver,
} from "@/cache/implementations/derivables/_module-exports.js";
import { withCacheFactory } from "@/cache/implementations/middlewares/with-cache-factory/with-cache-factory.js";
import { use } from "@/middleware/implementations/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

describe("function: withCacheFactory", () => {
    const cacheResolver = new CacheResolver<"memory">({
        adapters: { memory: new NoOpCacheAdapter() },
        defaultAdapter: "memory",
    });
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call getOrAdd with the key, loader and ttl", async () => {
        const spy = vi.spyOn(Cache.prototype, "getOrAdd");

        const withCache = withCacheFactory(cacheResolver);

        async function fn(_value: string): Promise<void> {}
        const key = "key";
        const ttl = TimeSpan.fromSeconds(20);
        await use(
            fn,
            withCache({
                ttl,
                key: ([value]) => value,
            }),
        )(key);

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            key,
            expect.any(Function),
            ttl,
        );
    });
});
