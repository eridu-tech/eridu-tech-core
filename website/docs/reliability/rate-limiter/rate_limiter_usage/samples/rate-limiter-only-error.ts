import { rateLimiterFactory } from "./rate-limiter-factory-initial-config.js";

class ErrorA extends Error {}

const rateLimiter = rateLimiterFactory.create("resource", {
    onlyError: true,
    limit: 10,
});
await rateLimiter.runOrFail(async () => {
    // The code / function to rate limit, called it here
});
