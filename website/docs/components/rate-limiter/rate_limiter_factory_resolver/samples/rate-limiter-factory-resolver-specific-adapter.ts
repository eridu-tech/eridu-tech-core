import { rateLimiterFactoryResolver } from "./rate-limiter-factory-resolver-initial-config.js";

// Will apply rate-limiter logic using the redis adapter
await rateLimiterFactoryResolver
    .use("redis")
    .create("a", {
        limit: 10,
    })
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
