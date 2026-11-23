/**
 * @module CircuitBreaker
 */

import type { CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/circuit-breaker-state.contract.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";

/**
 * Available circuit breaker policies.
 *
 * - CONSECUTIVE: opens after a number of consecutive failures
 * - COUNT: opens when the failure ratio of a count based window is exceeded
 * - SAMPLING: opens when the failure ratio of a time based window is exceeded
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export const BREAKER_POLICIES = {
    CONSECUTIVE: "CONSECUTIVE",
    COUNT: "COUNT",
    SAMPLING: "SAMPLING",
} as const;

/**
 * Settings for the consecutive policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ConsecutiveBreakerSettings = {
    /**
     * Amount of consecutive failures before going from closed -> open.
     *
     * @default 5
     */
    failureThreshold?: number;

    /**
     * Amount of consecutive success before going from half-open -> closed.
     *
     * @default settings.failureThreshold
     */
    successThreshold?: number;
};

/**
 * Settings for the count policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CountBreakerSettings = {
    /**
     * Percentage (from 0 to 1) failures before going from closed -> open.
     *
     * @default 0.2
     */
    failureThreshold?: number;

    /**
     * Percentage (from 0 to 1) successes before going from half-open -> closed.
     *
     * @default
     * ```ts
     * 1 - settings.failureThreshold
     * ```
     */
    successThreshold?: number;

    /**
     * Size of the count based sliding window.
     *
     * @default 20
     */
    size?: number;

    /**
     * The minimum number of calls to go from closed -> open, half-opened -> closed or half-opened -> open.
     *
     * @default
     * ```ts
     * settings.size
     * ```
     */
    minimumNumberOfCalls?: number;
};

/**
 * Settings for the sampling policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type SamplingBreakerSettings = {
    /**
     * Percentage (from 0 to 1) failures before going from closed -> open.
     *
     * @default 0.2
     */
    failureThreshold?: number;

    /**
     * Percentage (from 0 to 1) successes before going from half-open -> closed.
     *
     * @default
     * ```ts
     * 1 - settings.failureThreshold
     * ```
     */
    successThreshold?: number;

    /**
     * Length of time over which to sample.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(1)
     * ```
     */
    timeSpan?: ITimeSpan;

    /**
     * The sample length time.
     *
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromTimeSpan(settings.timeSpan).divide(6)
     * ```
     */
    sampleTimeSpan?: ITimeSpan;

    /**
     * The minimum number of calls per seconds to go from closed -> open, half-opened -> closed or half-opened -> open.
     *
     * @default 5
     */
    minimumRps?: number;
};

/**
 * Settings of the consecutive policy including its discriminant.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ConsecutiveBreakerSettingsEnum = ConsecutiveBreakerSettings & {
    /**
     * Discriminant identifying this as the consecutive breaker policy.
     */
    type: (typeof BREAKER_POLICIES)["CONSECUTIVE"];
};

/**
 * Settings of the count policy including its discriminant.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CountBreakerSettingsEnum = CountBreakerSettings & {
    /**
     * Discriminant identifying this as the count breaker policy.
     */
    type: (typeof BREAKER_POLICIES)["COUNT"];
};

/**
 * Settings of the sampling policy including its discriminant.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type SamplingBreakerSettingsEnum = SamplingBreakerSettings & {
    /**
     * Discriminant identifying this as the sampling breaker policy.
     */
    type: (typeof BREAKER_POLICIES)["SAMPLING"];
};

/**
 * Union of every circuit breaker policy settings.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerPolicySettingsEnum =
    | ConsecutiveBreakerSettingsEnum
    | CountBreakerSettingsEnum
    | SamplingBreakerSettingsEnum;

/**
 * Metrics tracked by the consecutive policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ConsecutiveBreakerMetrics = {
    failureCount: number;
    successCount: number;
};

/**
 * Metrics tracked by the count policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CountBreakerMetrics = {
    samples: Array<boolean>;
};

/**
 * A single time bucket of the sampling policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type Sample = {
    startedAt: number;
    failures: number;
    successes: number;
};

/**
 * Metrics tracked by the sampling policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type SamplingBreakerMetrics = {
    samples: Array<Sample>;
};

/**
 * A circuit breaker that is operating normally.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ClosedState<TMetrics = unknown> = {
    /**
     * Discriminator for the `CLOSED` state.
     */
    type: typeof CIRCUIT_BREAKER_STATE.CLOSED;

    /**
     * Accumulated metrics used to decide if the circuit should open.
     */
    metrics: TMetrics;
};

/**
 * A circuit breaker that is testing if the service recovered.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type HalfOpenState<TMetrics = unknown> = {
    /**
     * Discriminator for the `HALF_OPEN` state.
     */
    type: typeof CIRCUIT_BREAKER_STATE.HALF_OPEN;

    /**
     * Amount of times the circuit opened so far.
     */
    attempt: number;

    /**
     * Metrics collected while the circuit is half open.
     */
    metrics: TMetrics;
};

/**
 * A circuit breaker that blocks every call until the backoff has elapsed.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type OpenState = {
    /**
     * Discriminator for the `OPEN` state.
     */
    type: typeof CIRCUIT_BREAKER_STATE.OPEN;

    /**
     * Amount of times the circuit opened so far.
     */
    attempt: number;

    /**
     * Unix timestamp in milliseconds.
     */
    startedAt: number;
};

/**
 * A circuit breaker that was manually isolated.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type IsolatedState = {
    /**
     * Discriminator for the `ISOLATED` state.
     */
    type: typeof CIRCUIT_BREAKER_STATE.ISOLATED;
};

/**
 * Every state a stored circuit breaker entry can have.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type AllCircuitBreakerState<TMetrics = unknown> =
    ClosedState<TMetrics> | HalfOpenState<TMetrics> | OpenState | IsolatedState;

/**
 * Stored state of the consecutive policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type ConsecutiveBreakerStateEnum = {
    type: (typeof BREAKER_POLICIES)["CONSECUTIVE"];
    state: AllCircuitBreakerState<ConsecutiveBreakerMetrics>;
};

/**
 * Stored state of the count policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CountBreakerStateEnum = {
    type: (typeof BREAKER_POLICIES)["COUNT"];
    state: AllCircuitBreakerState<CountBreakerMetrics>;
};

/**
 * Stored state of the sampling policy.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type SamplingBreakerStateEnum = {
    type: (typeof BREAKER_POLICIES)["SAMPLING"];
    state: AllCircuitBreakerState<SamplingBreakerMetrics>;
};

/**
 * Union of every stored circuit breaker policy state.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Contracts
 */
export type CircuitBreakerStateEnum =
    | ConsecutiveBreakerStateEnum
    | CountBreakerStateEnum
    | SamplingBreakerStateEnum;
