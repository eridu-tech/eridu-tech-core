import { rateLimiterFactoryResolver } from "./rate-limiter-factory-resolver-initial-config.js";

await rateLimiterFactoryResolver
    .use("redis")
    .create("a", {
        limit: 10,
    })
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
