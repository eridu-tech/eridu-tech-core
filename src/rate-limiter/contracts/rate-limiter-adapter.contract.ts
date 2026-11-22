/**
 * @module RateLimiter
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { IRateLimiterFactory } from "@/rate-limiter/contracts/rate-limiter-factory.contract.js";

/**
 * State snapshot of a stored rate limiter entry.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterAdapterState = {
    /**
     * Whether the attempt was allowed (`true`) or blocked (`false`).
     */
    success: boolean;

    /**
     * Attempt sequence number, incremented on every update whether allowed or not.
     */
    attempt: number;

    /**
     * When the entry expires or its block is lifted.
     */
    resetTime: Date;
};

/**
 * Storage contract implemented by rate limiter adapters.
 *
 * Adapters persist the state machine of a configured policy (fixed or sliding window).
 * Use {@link IRateLimiterFactory | `IRateLimiterFactory`} instead of this contract directly.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterAdapter = {
    /**
     * Reads the entry for `key` without recording an attempt.
     *
     * @param key - Key of the rate limiter
     * @returns The current state, or `null` when nothing is stored or the entry expired
     */
    getState(key: string): Promise<IRateLimiterAdapterState | null>;

    /**
     * Records an attempt for `key` and applies the configured policy.
     *
     * @param key - Key of the rate limiter
     * @param limit - Maximum attempts allowed in the current window
     * @returns The resulting state, including whether the attempt was allowed
     */
    updateState(key: string, limit: number): Promise<IRateLimiterAdapterState>;

    /**
     * Removes the entry for `key`. Safe to call when no entry exists.
     *
     * @param key - Key of the rate limiter to clear
     */
    reset(key: string): Promise<void>;
};
