/**
 * @module RateLimiter
 */

import type { TimeSpan } from "@/time-span/implementations/_module-exports.js";

/**
 * Rate limiter state discriminators.
 *
 * - BLOCKED: attempts are rejected until the block ends
 * - ALLOWED: attempts are within the limit
 * - EXPIRED: nothing is stored, so a fresh quota applies
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export const RATE_LIMITER_STATE = {
    BLOCKED: "BLOCKED",
    ALLOWED: "ALLOWED",
    EXPIRED: "EXPIRED",
} as const;

/**
 * Union of the {@link RATE_LIMITER_STATE | `RATE_LIMITER_STATE`} values.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterStateLiterals =
    (typeof RATE_LIMITER_STATE)[keyof typeof RATE_LIMITER_STATE];

/**
 * A rate limiter with no stored state, e.g. before the first attempt or after expiry.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterExpiredState = {
    /**
     * Discriminator for the `EXPIRED` state.
     */
    type: (typeof RATE_LIMITER_STATE)["EXPIRED"];
};

/**
 * A rate limiter that is still allowing attempts.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterAllowedState = {
    /**
     * Discriminator for the `ALLOWED` state.
     */
    type: (typeof RATE_LIMITER_STATE)["ALLOWED"];

    /**
     * Attempts recorded in the current window.
     */
    usedAttempts: number;

    /**
     * Attempts left before blocking (`limit - usedAttempts`).
     */
    remainingAttempts: number;

    /**
     * Maximum attempts allowed per window.
     */
    limit: number;

    /**
     * Time left until the current window resets.
     */
    resetAfter: TimeSpan;
};

/**
 * A rate limiter that is rejecting attempts.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterBlockedState = {
    /**
     * Discriminator for the `BLOCKED` state.
     */
    type: (typeof RATE_LIMITER_STATE)["BLOCKED"];

    /**
     * Maximum attempts allowed per window; the threshold that was exceeded.
     */
    limit: number;

    /**
     * Attempts recorded, including those over the limit.
     */
    totalAttempts: number;

    /**
     * Attempts over the limit (`totalAttempts - limit`).
     */
    exceedAttempts: number;

    /**
     * Time left until attempts are allowed again.
     */
    retryAfter: TimeSpan;
};

/**
 * Any rate limiter state, discriminated by `type`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type RateLimiterState =
    RateLimiterExpiredState | RateLimiterBlockedState | RateLimiterAllowedState;
