/**
 * @module RateLimiter
 */

import { TO_MILLISECONDS } from "@/time-span/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { FixedWindowLimiterSettings } from "@/rate-limiter/contracts/rate-limiter-policy.contract.js";

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
