import { rateLimiterFactory } from "./rate-limiter-factory-initial-config.js";

export const rateLimiter = rateLimiterFactory.create("resource", {
    limit: 10,
});
