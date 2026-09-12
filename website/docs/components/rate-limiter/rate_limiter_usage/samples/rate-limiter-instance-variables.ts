import { rateLimiterFactory } from "./rate-limiter-factory-initial-config.js";

const rateLimiter = rateLimiterFactory.create("resource", {
    limit: 10,
});

// Will return the key of the rate-limiter which is "resource"
console.log(rateLimiter.key);
