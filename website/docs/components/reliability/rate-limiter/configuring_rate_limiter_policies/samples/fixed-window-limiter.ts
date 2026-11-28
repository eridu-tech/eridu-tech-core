import { LIMITER_POLICIES } from "eridu-tech/rate-limiter/contracts";
import { MemoryRateLimiterAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-adapter";
import { TimeSpan } from "eridu-tech/time-span";

export const rateLimiterAdapter = new MemoryRateLimiterAdapter({
    rateLimiterPolicy: {
        type: LIMITER_POLICIES.FIXED_WINDOW,

        /**
         * The time span in which attempts are active before reseting.
         * The field is optional.
         */
        window: TimeSpan.fromSeconds(1),
    },
});
