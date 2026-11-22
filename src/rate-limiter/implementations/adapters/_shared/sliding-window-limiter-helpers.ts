/**
 * @module RateLimiter
 */

import { TO_MILLISECONDS } from "@/time-span/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/policies"`
 * @group Policies
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
 * @internal
 */
export function resolveSlidingWindowLimiterSettings(
    settings: SlidingWindowLimiterSettings,
): Required<SlidingWindowLimiterSettings> {
    const {
        window = TimeSpan.fromSeconds(1),
        margin = TimeSpan.fromTimeSpan(window).divide(4),
    } = settings;

    return {
        window,
        margin,
    };
}

/**
 * @internal
 */
export type SerializedSlidingWindowLimiterSettings = {
    window?: number;
    margin?: number;
};

/**
 * @internal
 */
export function serializeSlidingWindowLimiterSettings(
    settings: SlidingWindowLimiterSettings,
): Required<SerializedSlidingWindowLimiterSettings> {
    const { window, margin } = resolveSlidingWindowLimiterSettings(settings);
    return {
        window: window[TO_MILLISECONDS](),
        margin: margin[TO_MILLISECONDS](),
    };
}

/**
 * Defines the structure for tracking attempts in the rate limiter.
 * The key is the timestamp of the window's start (e.g., 1700000000000).
 * The value is the attempts for that window.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/policies"`
 * @group Policies
 */
export type SlidingWindowLimiterState = Partial<Record<number, number>>;
