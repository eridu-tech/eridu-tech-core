/**
 * @module RateLimiter
 */

import { RATE_LIMITER_STATE } from "@/rate-limiter/contracts/_module-exports.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    IRateLimiterAdapterState,
    SlidingWindowLimiterMetrics,
    SlidingWindowLimiterSettings,
    SlidingWindowLimiterStateEnum,
} from "@/rate-limiter/contracts/_module-exports.js";

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
 * Start of the window containing `currentDate`, as a Unix timestamp in ms.
 *
 * @internal
 */
export function resolveSlidingWindowStart(
    currentDate: Date,
    window: number,
): number {
    return Math.floor(currentDate.getTime() / window) * window;
}

/**
 * Mirrors `SlidingWindowLimiter.getAttempts`: the current window plus the
 * previous window's attempts weighted by the time left in the current window.
 *
 * @internal
 */
function resolveSlidingWindowAttempts(
    metrics: SlidingWindowLimiterMetrics | undefined,
    currentDate: Date,
    window: number,
): number {
    if (metrics === undefined) {
        return 0;
    }
    const currentWindow = resolveSlidingWindowStart(currentDate, window);
    const percentageInCurrentWindow = (currentDate.getTime() % window) / window;
    const currentAttempt = metrics[currentWindow] ?? 0;
    const previousAttempt = Math.floor(
        (1 - percentageInCurrentWindow) *
            (metrics[currentWindow - window] ?? 0),
    );
    return currentAttempt + previousAttempt;
}

/**
 * Maps a stored sliding-window state to the adapter state shape.
 *
 * @internal
 */
export function resolveSlidingWindowAdapterState(
    data: SlidingWindowLimiterStateEnum,
    expiration: Date,
    currentDate: Date,
    window: number,
): IRateLimiterAdapterState {
    const { state } = data;
    if (state.type === RATE_LIMITER_STATE.ALLOWED) {
        return {
            success: true,
            attempt: resolveSlidingWindowAttempts(
                state.metrics,
                currentDate,
                window,
            ),
            resetTime: expiration,
        };
    }
    return {
        success: false,
        attempt: state.attempt,
        resetTime: expiration,
    };
}
