import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";

const adapter = new DatabaseRateLimiterAdapter({
    adapter: new MemoryRateLimiterStorageAdapter(),
});

await adapter.getState("api:login");
// -> checks rate limit for "api:login"
