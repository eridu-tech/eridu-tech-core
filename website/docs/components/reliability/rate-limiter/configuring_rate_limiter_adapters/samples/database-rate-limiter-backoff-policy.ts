import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { constantBackoff } from "eridu-tech/backoff-policies";
import { rateLimiterStorageAdapter } from "./rate-limiter-storage-adapter.js";

const rateLimiterAdapter = new DatabaseRateLimiterAdapter({
    adapter: rateLimiterStorageAdapter,
    backoffPolicy: constantBackoff(),
});
