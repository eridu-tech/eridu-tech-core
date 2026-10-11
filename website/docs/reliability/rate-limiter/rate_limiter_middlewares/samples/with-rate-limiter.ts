import { withRateLimiterFactory } from "eridu-tech/rate-limiter/middlewares";
import { use } from "eridu-tech/middleware";
import { rateLimiterFactoryResolver } from "./rate-limiter.js";

const withRateLimiter = withRateLimiterFactory(rateLimiterFactoryResolver);

const fetchHandler = async (request: Request): Promise<Response> => {
    // ... handle the request
    return new Response("OK");
};

// Wrap with rate limiter using the default adapter (`storage1`) — max 10 calls per window
const rateLimitedCall = use(
    fetchHandler,
    withRateLimiter({
        key: ([req]) => `api:${String(req.headers.get("x-ip"))}`,
        limit: 10,
    }),
);

// Wrap with rate limiter using a specific adapter (`storage2`)
const rateLimitedCallOnStorage2 = use(
    fetchHandler,
    withRateLimiter.use("storage2")({
        key: ([req]) => `api:${String(req.headers.get("x-ip"))}`,
        limit: 10,
    }),
);

await rateLimitedCall(
    new Request("/url", {
        method: "POST",
    }),
);
