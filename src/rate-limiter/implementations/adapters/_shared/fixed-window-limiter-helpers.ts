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
 * @internal
 */
export function resolveFixedWindowLimiterSettings(
    settings: FixedWindowLimiterSettings,
): Required<FixedWindowLimiterSettings> {
    const { window = TimeSpan.fromSeconds(1) } = settings;

    return {
        window,
    };
}

/**
 * @internal
 */
export type SerializedFixedWindowLimiterSettings = {
    window?: number;
};

/**
 * @internal
 */
export function serializeFixedWindowLimiterSettings(
    settings: FixedWindowLimiterSettings,
): Required<SerializedFixedWindowLimiterSettings> {
    const { window } = resolveFixedWindowLimiterSettings(settings);
    return {
        window: window[TO_MILLISECONDS](),
    };
}

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/policies"`
 * @group Policies
 */
export type FixedWindowLimiterState = {
    attempt: number;

    /**
     * Unix timestamp in ms
     */
    lastAttemptAt: number;
};
