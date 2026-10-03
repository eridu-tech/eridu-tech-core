import { RateLimiterFactoryResolver } from "eridu-tech/rate-limiter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

export const rateLimiterFactoryResolver = new RateLimiterFactoryResolver({
    adapters: {
        storage1: new DatabaseRateLimiterAdapter({
            adapter: new MemoryRateLimiterStorageAdapter(),
        }),
        storage2: new DatabaseRateLimiterAdapter({
            adapter: new MemoryRateLimiterStorageAdapter(),
        }),
    },
    defaultAdapter: "storage1",
});
