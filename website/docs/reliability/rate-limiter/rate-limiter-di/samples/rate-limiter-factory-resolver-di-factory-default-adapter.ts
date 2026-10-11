import { rateLimiterFactory } from "./rate-limiter-factory-resolver-di-factory.js";

// Uses the adapter configured as the default (storage1)
await rateLimiterFactory
    .create("shared-resource", {
        limit: 10,
    })
    .runOrFail(async () => {
        // code to run
    });
