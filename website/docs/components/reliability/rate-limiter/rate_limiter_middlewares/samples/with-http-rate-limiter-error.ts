import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { BlockedRateLimiterError } from "eridu-tech/rate-limiter/contracts";
import { withHttpRateLimiterError } from "eridu-tech/rate-limiter/middlewares";
import { TimeSpan } from "eridu-tech/time-span";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter(),
});

router.use(withHttpRateLimiterError());

router.endpoint({
    url: "/reports/1",
    method: ["POST"],
    handler: async () => {
        // A 429 response with the `RateLimit` and `Retry-After` headers
        throw BlockedRateLimiterError.create(
            {
                limit: 10,
                totalAttempts: 12,
                exceedAttempts: 2,
                retryAfter: TimeSpan.fromSeconds(30),
            },
            "tenant:1",
        );
    },
});
