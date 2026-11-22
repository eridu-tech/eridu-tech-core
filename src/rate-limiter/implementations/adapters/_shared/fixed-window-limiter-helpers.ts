/**
 * @module RateLimiter
 */

import { RATE_LIMITER_STATE } from "@/rate-limiter/contracts/_module-exports.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    FixedWindowLimiterSettings,
    FixedWindowLimiterStateEnum,
    IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module-exports.js";

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
 * Maps a stored fixed-window state to the adapter state shape.
 *
 * @internal
 */
export function resolveFixedWindowAdapterState(
    data: FixedWindowLimiterStateEnum,
    expiration: Date,
): IRateLimiterAdapterState {
    const { state } = data;
    if (state.type === RATE_LIMITER_STATE.ALLOWED) {
        return {
            success: true,
            attempt: state.metrics.attempt,
            resetTime: expiration,
        };
    }
    return {
        success: false,
        attempt: state.attempt,
        resetTime: expiration,
    };
}
