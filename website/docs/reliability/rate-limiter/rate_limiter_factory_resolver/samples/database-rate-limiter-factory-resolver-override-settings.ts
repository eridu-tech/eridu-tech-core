import { SlidingWindowLimiter } from "eridu-tech/rate-limiter/policies";
import { constantBackoff } from "eridu-tech/backoff-policies";
import { rateLimiterFactoryResolver } from "./database-rate-limiter-factory-resolver-initial-config.js";

await rateLimiterFactoryResolver
    .setBackoffPolicy(constantBackoff())
    .setRateLimiterPolicy(new SlidingWindowLimiter())
    .use("sqlite")
    .create("a", {
        limit: 10,
    })
    .runOrFail(async () => {
        // ... code to apply rate-limiter logic
    });
