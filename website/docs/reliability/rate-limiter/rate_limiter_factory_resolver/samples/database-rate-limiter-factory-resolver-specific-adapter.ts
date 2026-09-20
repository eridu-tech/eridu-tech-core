import { rateLimiterFactoryResolver } from "./database-rate-limiter-factory-resolver-initial-config.js";

// Will apply rate-limiter logic using the sqlite adapter
await rateLimiterFactoryResolver
    .use("sqlite")
    .create("a", {
        limit: 10,
    })
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
