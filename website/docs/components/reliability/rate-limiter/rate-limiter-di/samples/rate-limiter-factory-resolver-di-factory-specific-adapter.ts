import { rateLimiterFactory } from "./rate-limiter-factory-resolver-di-factory.js";

// Uses the Redis adapter
await rateLimiterFactory
    .use("redis")
    .create("shared-resource", {
        limit: 10,
    })
    .runOrFail(async () => {
        // code to run
    });
