/**
 * @module RateLimiter
 */

import { resolveSlidingWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { SlidingWindowLimiterSettings } from "@/rate-limiter/contracts/_module-exports.js";
import type { SlidingWindowLimiterState } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import type { IRateLimiterPolicy } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/rate-limiter-policy.contract.js";

/**
 * @internal
 */
export class SlidingWindowLimiter implements IRateLimiterPolicy<SlidingWindowLimiterState> {
    private readonly window: TimeSpan;
    private readonly margin: TimeSpan;

    constructor(settings: SlidingWindowLimiterSettings = {}) {
        const { window, margin } =
            resolveSlidingWindowLimiterSettings(settings);
        this.window = TimeSpan.fromTimeSpan(window);
        this.margin = TimeSpan.fromTimeSpan(margin);
    }

    private currentWindow(currentDate: Date): number {
        return (
            Math.floor(currentDate.getTime() / this.window.toMilliseconds()) *
            this.window.toMilliseconds()
        );
    }

    private previousWindow(currentDate: Date): number {
        return this.currentWindow(currentDate) - this.window.toMilliseconds();
    }

    private cleanup(
        metrics: SlidingWindowLimiterState,
        currentDate: Date,
    ): SlidingWindowLimiterState {
        const previousWindow = this.previousWindow(currentDate);
        return Object.fromEntries(
            Object.entries(metrics).filter(([timeStampAsStr]) => {
                const timeStamp = Number(timeStampAsStr);

                return timeStamp >= previousWindow;
            }),
        );
    }

    private currentAttempt(
        currentMetrics: SlidingWindowLimiterState,
        currentDate: Date,
    ): number {
        return currentMetrics[this.currentWindow(currentDate)] ?? 0;
    }

    private previousAttempt(
        currentMetrics: SlidingWindowLimiterState,
        currentDate: Date,
    ): number {
        let previousAttempt =
            currentMetrics[this.previousWindow(currentDate)] ?? 0;

        const percentageInCurrentWindow =
            (currentDate.getTime() % this.window.toMilliseconds()) /
            this.window.toMilliseconds();
        previousAttempt = Math.floor(
            (1 - percentageInCurrentWindow) * previousAttempt,
        );

        return previousAttempt;
    }

    initialMetrics(currentDate: Date): SlidingWindowLimiterState {
        return {
            [this.currentWindow(currentDate)]: 0,
        };
    }

    shouldBlock(
        currentMetrics: SlidingWindowLimiterState,
        limit: number,
        currentDate: Date,
    ): boolean {
        const currentAttempts = this.currentAttempt(
            currentMetrics,
            currentDate,
        );
        const previousAttempts = this.previousAttempt(
            currentMetrics,
            currentDate,
        );
        return currentAttempts + previousAttempts >= limit;
    }

    getExpiration(
        _currentMetrics: SlidingWindowLimiterState,
        currentDate: Date,
    ): Date {
        return this.window
            .multiply(2)
            .addTimeSpan(this.margin)
            .toEndDate(new Date(this.currentWindow(currentDate)));
    }

    getAttempts(
        currentMetrics: SlidingWindowLimiterState,
        currentDate: Date,
    ): number {
        const currentAttempt = this.currentAttempt(currentMetrics, currentDate);
        const previousAttempt = this.previousAttempt(
            currentMetrics,
            currentDate,
        );
        return currentAttempt + previousAttempt;
    }

    updateMetrics(
        currentMetrics: SlidingWindowLimiterState,
        currentDate: Date,
    ): SlidingWindowLimiterState {
        currentMetrics = this.cleanup(currentMetrics, currentDate);
        const currentAttempt = this.currentAttempt(currentMetrics, currentDate);
        const currentKey = this.currentWindow(currentDate);
        return {
            ...currentMetrics,
            [currentKey]: currentAttempt + 1,
        };
    }
}
