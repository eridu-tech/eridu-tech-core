/**
 * @module CircuitBreaker
 */

import {
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
    resolveSamplingBreakerSettings,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    Sample,
    SamplingBreakerMetrics,
    SamplingBreakerSettings,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type {
    CircuitBreakerTrackSettings,
    CircuitBreakerTrackState,
    ClosedTransitions,
    HalfOpenTransitions,
    ICircuitBreakerPolicy,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";

/**
 * @internal
 */
type ProccesedMetricData = {
    total: number;
    totalFailures: number;
    totalSuccesses: number;
};

/**
 * The `SamplingBreaker` breaks after a proportion of requests over a time period fail.
 *
 * @internal
 */
export class SamplingBreaker implements ICircuitBreakerPolicy<SamplingBreakerMetrics> {
    private readonly failureThreshold: number;
    private readonly successThreshold: number;
    private readonly timeSpan: TimeSpan;
    private readonly sampleTimeSpan: TimeSpan;
    private readonly minimumRps: number;

    constructor(settings: SamplingBreakerSettings = {}) {
        const {
            failureThreshold,
            successThreshold,
            timeSpan,
            sampleTimeSpan,
            minimumRps,
        } = resolveSamplingBreakerSettings(settings);

        this.failureThreshold = failureThreshold;
        this.successThreshold = successThreshold;
        this.timeSpan = TimeSpan.fromTimeSpan(timeSpan);
        this.sampleTimeSpan = TimeSpan.fromTimeSpan(sampleTimeSpan);
        this.minimumRps = minimumRps;
    }

    initialMetrics(): SamplingBreakerMetrics {
        return {
            samples: [],
        };
    }

    private static getProccesedMetricData(
        currentMetrics: SamplingBreakerMetrics,
    ): ProccesedMetricData {
        let totalFailures = 0;
        let totalSuccesses = 0;
        for (const sample of currentMetrics.samples) {
            totalFailures += sample.failures;
            totalSuccesses += sample.successes;
        }
        const total = totalFailures + totalSuccesses;
        return {
            total,
            totalFailures,
            totalSuccesses,
        };
    }

    private isMiniumNotMet(total: number): boolean {
        return total < Math.ceil(this.timeSpan.toSeconds() * this.minimumRps);
    }

    whenClosed(
        currentMetrics: SamplingBreakerMetrics,
        _currentDate: Date,
    ): ClosedTransitions {
        const { total, totalFailures } =
            SamplingBreaker.getProccesedMetricData(currentMetrics);

        if (this.isMiniumNotMet(total)) {
            return CLOSED_TRANSITIONS.NONE;
        }

        const failureCount = Math.ceil(this.failureThreshold * total);
        const hasFailed = totalFailures > failureCount;
        if (hasFailed) {
            return CLOSED_TRANSITIONS.TO_OPEN;
        }

        return CLOSED_TRANSITIONS.NONE;
    }

    whenHalfOpened(
        currentMetrics: SamplingBreakerMetrics,
        _currentDate: Date,
    ): HalfOpenTransitions {
        const { total, totalSuccesses } =
            SamplingBreaker.getProccesedMetricData(currentMetrics);

        if (this.isMiniumNotMet(total)) {
            return HALF_OPEN_TRANSITIONS.NONE;
        }

        const successCount = Math.ceil(this.successThreshold * total);
        const hasSucceeded = totalSuccesses > successCount;
        if (hasSucceeded) {
            return HALF_OPEN_TRANSITIONS.TO_CLOSED;
        }
        return HALF_OPEN_TRANSITIONS.TO_OPEN;
    }

    private isWithinWindow(currentDate: Date) {
        return (sample: Sample): boolean => {
            const windowStart = this.timeSpan.toStartDate(currentDate);
            const sampleEnd = this.sampleTimeSpan.toEndDate(
                new Date(sample.startedAt),
            );
            return sampleEnd >= windowStart;
        };
    }

    private hasSampleEnded(sample: Sample, currentDate: Date): boolean {
        return (
            this.sampleTimeSpan.toEndDate(new Date(sample.startedAt)) <=
            currentDate
        );
    }

    private track(
        success: boolean,
        currentState: CircuitBreakerTrackState<SamplingBreakerMetrics>,
        settings: CircuitBreakerTrackSettings<SamplingBreakerMetrics>,
    ): SamplingBreakerMetrics {
        const samples = [...currentState.metrics.samples].filter(
            this.isWithinWindow(settings.currentDate),
        );

        const lastSample = samples.at(-1);
        let currentSample: Sample;
        if (
            lastSample === undefined ||
            this.hasSampleEnded(lastSample, settings.currentDate)
        ) {
            currentSample = {
                failures: 0,
                successes: 0,
                startedAt: settings.currentDate.getTime(),
            };
            samples.push(currentSample);
        } else {
            currentSample = { ...lastSample };
            samples[samples.length - 1] = currentSample;
        }

        if (success) {
            currentSample.successes++;
        } else {
            currentSample.failures++;
        }

        return {
            samples,
        };
    }

    trackFailure(
        currentState: CircuitBreakerTrackState<SamplingBreakerMetrics>,
        settings: CircuitBreakerTrackSettings<SamplingBreakerMetrics>,
    ): SamplingBreakerMetrics {
        return this.track(false, currentState, settings);
    }

    trackSuccess(
        currentState: CircuitBreakerTrackState<SamplingBreakerMetrics>,
        settings: CircuitBreakerTrackSettings<SamplingBreakerMetrics>,
    ): SamplingBreakerMetrics {
        return this.track(true, currentState, settings);
    }

    isEqual(
        metricsA: SamplingBreakerMetrics,
        metricsB: SamplingBreakerMetrics,
    ): boolean {
        const sortedMetricsA = [...metricsA.samples].sort(
            (metrics1, metrics2) =>
                metrics1.startedAt > metrics2.startedAt ? 1 : -1,
        );
        const sortedMetricsB = [...metricsB.samples].sort(
            (metrics1, metrics2) =>
                metrics1.startedAt > metrics2.startedAt ? 1 : -1,
        );
        return (
            JSON.stringify(sortedMetricsA) === JSON.stringify(sortedMetricsB)
        );
    }
}
