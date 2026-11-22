/**
 * @module RateLimiter
 */

import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export const LIMITER_POLICIES = {
    FIXED_WINDOW: "FIXED_WINDOW",
    SLIDING_WINDOW: "SLIDING_WINDOW",
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type FixedWindowLimiterSettings = {
    /**
     * The time span in which attempts are active before reseting.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromSeconds(1)
     * ```
     */
    window?: ITimeSpan;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type SlidingWindowLimiterSettings = {
    /**
     * The time span in which attempts are active before reseting.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromSeconds(1)
     * ```
     */
    window?: ITimeSpan;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromTimeSpan(window).divide(4)
     * ```
     */
    margin?: ITimeSpan;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type FixedWindowLimiterSettingsEnum = FixedWindowLimiterSettings & {
    /**
     * Discriminant identifying this as the fixed-window rate-limiter policy.
     */
    type: (typeof LIMITER_POLICIES)["FIXED_WINDOW"];
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type SlidingWindowLimiterSettingsEnum = SlidingWindowLimiterSettings & {
    /**
     * Discriminant identifying this as the sliding-window rate-limiter policy.
     */
    type: (typeof LIMITER_POLICIES)["SLIDING_WINDOW"];
};

/**
 * @internal
 */
export type RateLimiterPolicySettingsEnum =
    FixedWindowLimiterSettingsEnum | SlidingWindowLimiterSettingsEnum;
