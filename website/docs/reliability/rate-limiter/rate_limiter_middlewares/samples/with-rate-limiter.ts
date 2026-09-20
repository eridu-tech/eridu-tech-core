import { withRateLimiterFactory } from "eridu-tech/rate-limiter/middlewares";
import { use } from "eridu-tech/middleware";
import { rateLimiterFactory } from "./rate-limiter.js";

const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

const fetchHandler = async (request: Request): Promise<Response> => {
    // ... handle the request
    return new Response("OK");
};

// Wrap with rate limiter — max 10 calls per window
const rateLimitedCall = use(
    fetchHandler,
    withRateLimiter({
        key: ([req]) => `api:${String(req.headers.get("x-ip"))}`,
        limit: 10,
    }),
);

await rateLimitedCall(
    new Request("/url", {
        method: "POST",
    }),
);
