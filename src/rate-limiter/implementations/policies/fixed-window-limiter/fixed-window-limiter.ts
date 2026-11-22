/**
 * @module RateLimiter
 */

import { resolveFixedWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { IRateLimiterPolicy } from "@/rate-limiter/contracts/_module-exports.js";
import type {
    FixedWindowLimiterSettings,
    FixedWindowLimiterState,
} from "@/rate-limiter/implementations/adapters/_shared/_module.js";

/**
 * Each request inside a fixed time increases a counter.
 * Once the counter reaches the maximum allowed number, all further attempts are
 * rejected.
 *
 * **Pro:**
 *
 * - Newer attempts are not starved by old ones.
 * - Low storage cost.
 *
 * **Con:**
 *
 * A burst of attempts near the boundary of a window can result in a very
 * high request rate because two windows will be filled with attempts quickly.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/policies"`
 * @group Policies
 */
export class FixedWindowLimiter implements IRateLimiterPolicy<FixedWindowLimiterState> {
    private readonly window: TimeSpan;

    constructor(settings: FixedWindowLimiterSettings = {}) {
        const { window } = resolveFixedWindowLimiterSettings(settings);
        this.window = TimeSpan.fromTimeSpan(window);
    }

    initialMetrics(currentDate: Date): FixedWindowLimiterState {
        return {
            attempt: 0,
            lastAttemptAt: currentDate.getTime(),
        };
    }

    shouldBlock(
        currentMetrics: FixedWindowLimiterState,
        limit: number,
        currentDate: Date,
    ): boolean {
        const timeSinceLastAttempt =
            currentDate.getTime() - currentMetrics.lastAttemptAt;
        return (
            timeSinceLastAttempt < this.window.toMilliseconds() &&
            currentMetrics.attempt > limit
        );
    }

    getExpiration(
        currentMetrics: FixedWindowLimiterState,
        _currentDate: Date,
    ): Date {
        return this.window.toEndDate(new Date(currentMetrics.lastAttemptAt));
    }

    getAttempts(
        currentMetrics: FixedWindowLimiterState,
        _currentDate: Date,
    ): number {
        return currentMetrics.attempt;
    }

    updateMetrics(
        currentMetrics: FixedWindowLimiterState,
        currentDate: Date,
    ): FixedWindowLimiterState {
        return {
            attempt: currentMetrics.attempt + 1,
            lastAttemptAt: currentDate.getTime(),
        };
    }
}
