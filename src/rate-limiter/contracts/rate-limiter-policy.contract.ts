/**
 * @module RateLimiter
 */

import type { RATE_LIMITER_STATE } from "@/rate-limiter/contracts/rate-limiter-state.contract.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";

/**
 * Available rate limiter policies.
 *
 * - FIXED_WINDOW: counts attempts within a single fixed-length window
 * - SLIDING_WINDOW: counts attempts per window and weights the previous one
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export const LIMITER_POLICIES = {
    FIXED_WINDOW: "FIXED_WINDOW",
    SLIDING_WINDOW: "SLIDING_WINDOW",
} as const;

/**
 * Settings for the fixed-window policy.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type FixedWindowLimiterSettings = {
    /**
     * How long an attempt stays counted; every attempt restarts the window.
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
 * Settings for the sliding-window policy.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type SlidingWindowLimiterSettings = {
    /**
     * Length of each window bucket.
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
     * Extra lifetime added to stored state so previous-window counts survive the boundary.
     *
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
 * Fixed-window settings tagged with their policy discriminator.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type FixedWindowLimiterSettingsEnum = FixedWindowLimiterSettings & {
    /**
     * Discriminant identifying the fixed-window policy.
     */
    type: (typeof LIMITER_POLICIES)["FIXED_WINDOW"];
};

/**
 * Sliding-window settings tagged with their policy discriminator.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type SlidingWindowLimiterSettingsEnum = SlidingWindowLimiterSettings & {
    /**
     * Discriminant identifying the sliding-window policy.
     */
    type: (typeof LIMITER_POLICIES)["SLIDING_WINDOW"];
};

/**
 * Settings of the policy an adapter is configured with.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterPolicySettingsEnum =
    FixedWindowLimiterSettingsEnum | SlidingWindowLimiterSettingsEnum;

/**
 * Metrics stored by the fixed-window policy.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type FixedWindowLimiterMetrics = {
    /**
     * Attempts recorded in the current window.
     */
    attempt: number;

    /**
     * Unix timestamp in ms of the last attempt.
     */
    lastAttemptAt: number;
};

/**
 * Metrics stored by the sliding-window policy: attempts keyed by the Unix ms start of their window.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type SlidingWindowLimiterMetrics = Partial<Record<number, number>>;

/**
 * Internal policy state while attempts are allowed.
 *
 * @internal
 */
export type AllowedState<TMetrics = unknown> = {
    /**
     * Discriminator for the allowed state.
     */
    type: (typeof RATE_LIMITER_STATE)["ALLOWED"];

    /**
     * Metrics tracked by the configured policy.
     */
    metrics: TMetrics;
};

/**
 * Internal policy state while attempts are blocked.
 *
 * @internal
 */
export type BlockedState = {
    /**
     * Discriminator for the blocked state.
     */
    type: (typeof RATE_LIMITER_STATE)["BLOCKED"];

    /**
     * Unix timestamp in ms when blocking started.
     */
    startedAt: number;

    /**
     * Consecutive blocked attempts, used to compute the backoff delay.
     */
    attempt: number;
};

/**
 * Internal union of the allowed and blocked policy states.
 *
 * @internal
 */
export type AllRateLimiterState<TMetrics = unknown> =
    AllowedState<TMetrics> | BlockedState;
