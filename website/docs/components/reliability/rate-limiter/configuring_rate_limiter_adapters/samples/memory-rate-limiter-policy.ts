import { BACKOFFS } from "eridu-tech/backoff-policies";
import { LIMITER_POLICIES } from "eridu-tech/rate-limiter/contracts";
import { MemoryRateLimiterAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-adapter";
import { TimeSpan } from "eridu-tech/time-span";

export const memoryRateLimiterAdapter = new MemoryRateLimiterAdapter({
    backoffPolicy: {
        type: BACKOFFS.CONSTANT,
        delay: TimeSpan.fromSeconds(1),
        jitter: 0.5,
    },
    rateLimiterPolicy: {
        type: LIMITER_POLICIES.SLIDING_WINDOW,
        window: TimeSpan.fromSeconds(1),
    },
});
