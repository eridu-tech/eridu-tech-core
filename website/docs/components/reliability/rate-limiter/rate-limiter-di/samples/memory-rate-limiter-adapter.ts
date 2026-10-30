import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

export const memoryRateLimiterAdapter = new DatabaseRateLimiterAdapter({
    adapter: new MemoryRateLimiterStorageAdapter(),
});
