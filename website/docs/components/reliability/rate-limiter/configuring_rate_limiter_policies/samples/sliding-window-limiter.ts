import { LIMITER_POLICIES } from "eridu-tech/rate-limiter/contracts";
import { MemoryRateLimiterAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-adapter";
import { TimeSpan } from "eridu-tech/time-span";

export const rateLimiterAdapter = new MemoryRateLimiterAdapter({
    rateLimiterPolicy: {
        type: LIMITER_POLICIES.SLIDING_WINDOW,

        /**
         * The time span in which attempts are active before reseting.
         * The field is optional.
         */
        window: TimeSpan.fromSeconds(1),

        /**
         * Extra lifetime added to stored state so previous-window counts survive the boundary.
         * The field is optional.
         */
        margin: TimeSpan.fromSeconds(4).divide(4),
    },
});
