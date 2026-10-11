import { use } from "eridu-tech/middleware";
import { withRateLimiterFactory } from "eridu-tech/rate-limiter/middlewares";
import { rateLimiterFactory } from "./rate-limiter-factory-resolver-di-factory.js";

const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);

const fetchHandler = async (request: Request): Promise<Response> => {
    // ... handle the request
    return new Response("OK");
};

const rateLimitedCall = use(
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
