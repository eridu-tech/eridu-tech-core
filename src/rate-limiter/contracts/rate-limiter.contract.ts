/**
 * @module RateLimiter
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BlockedRateLimiterError } from "@/rate-limiter/contracts/rate-limiter.errors.js";

import type { RateLimiterState } from "@/rate-limiter/contracts/_module-exports.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * State and configuration of a rate limiter instance.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterStateMethods = {
    /**
     * Reads the current state without recording an attempt.
     *
     * @returns The current state: allowed, blocked or expired
     * @throws {UnableToGetStateRateLimiterError} When the adapter fails unexpectedly
     */
    getState(): Promise<RateLimiterState>;

    /**
     * Identifier of the quota this instance uses; instances sharing a key share the quota.
     */
    readonly key: string;

    /**
     * Maximum attempts allowed per rate limiter window.
     */
    readonly limit: number;
};

/**
 * Rate limiter operations.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiter = IRateLimiterStateMethods & {
    /**
     * Runs `asyncInvocable` when the rate limiter allows it.
     * Depending on how the limiter was created, the attempt is recorded before running
     * or only when the call throws.
     *
     * @template TValue - Value produced by `asyncInvocable`
     * @param asyncInvocable - Work to run when the attempt is allowed
     * @returns The value returned by `asyncInvocable`
     * @throws {BlockedRateLimiterError} When the limit is reached
     * @throws {UnableToUpdateStateRateLimiterError} When the adapter fails unexpectedly
     */
    runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue>;

    /**
     * Removes the stored state, giving the key a fresh quota.
     *
     * @throws {UnableToResetRateLimiterError} When the adapter fails unexpectedly
     */
    reset(): Promise<void>;
};
