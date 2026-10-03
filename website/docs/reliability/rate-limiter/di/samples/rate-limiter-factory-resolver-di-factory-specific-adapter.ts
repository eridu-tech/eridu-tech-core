import { rateLimiterFactory } from "./rate-limiter-factory-resolver-di-factory.js";

// Uses the storage2 adapter
await rateLimiterFactory
    .use("storage2")
    .create("shared-resource", {
        limit: 10,
    })
    .runOrFail(async () => {
        // code to run
    });
