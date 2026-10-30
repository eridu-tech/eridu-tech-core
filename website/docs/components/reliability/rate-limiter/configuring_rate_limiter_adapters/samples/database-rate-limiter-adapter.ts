import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { rateLimiterStorageAdapter } from "./rate-limiter-storage-adapter.js";

const rateLimiterAdapter = new DatabaseRateLimiterAdapter({
    adapter: rateLimiterStorageAdapter,
});
