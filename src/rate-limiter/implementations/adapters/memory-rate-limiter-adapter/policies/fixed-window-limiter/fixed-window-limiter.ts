/**
 * @module RateLimiter
 */

import { resolveFixedWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    FixedWindowLimiterSettings,
    FixedWindowLimiterMetrics,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { IRateLimiterPolicy } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/rate-limiter-policy.contract.js";

/**
 * @internal
 */
export class FixedWindowLimiter implements IRateLimiterPolicy<FixedWindowLimiterMetrics> {
    private readonly window: TimeSpan;

    constructor(settings: FixedWindowLimiterSettings = {}) {
        const { window } = resolveFixedWindowLimiterSettings(settings);
        this.window = TimeSpan.fromTimeSpan(window);
    }

    initialMetrics(currentDate: Date): FixedWindowLimiterMetrics {
        return {
            attempt: 0,
            lastAttemptAt: currentDate.getTime(),
        };
    }

    shouldBlock(
        currentMetrics: FixedWindowLimiterMetrics,
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
        currentMetrics: FixedWindowLimiterMetrics,
        _currentDate: Date,
    ): Date {
        return this.window.toEndDate(new Date(currentMetrics.lastAttemptAt));
    }

    getAttempts(
        currentMetrics: FixedWindowLimiterMetrics,
        _currentDate: Date,
    ): number {
        return currentMetrics.attempt;
    }

    updateMetrics(
        currentMetrics: FixedWindowLimiterMetrics,
        currentDate: Date,
    ): FixedWindowLimiterMetrics {
        return {
            attempt: currentMetrics.attempt + 1,
            lastAttemptAt: currentDate.getTime(),
        };
    }
}
