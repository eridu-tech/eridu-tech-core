/**
 * @module RateLimiter
 */

import type { RateLimiterBlockedState } from "@/rate-limiter/contracts/rate-limiter-state.contract.js";
import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * Thrown when the rate limiter blocks an attempt because the limit is reached.
 * The state that triggered the block is exposed through `state`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export class BlockedRateLimiterError extends Error {
    /**
     * Creates the error from the blocked `state` of the rate limiter identified by `key`.
     *
     * @param state - State that triggered the block
     * @param key - Key of the rate limiter that blocked the attempt
     * @param cause - Optional underlying error
     */
    static create(
        state: Omit<RateLimiterBlockedState, "type">,
        key: string,
        cause?: unknown,
    ): BlockedRateLimiterError {
        return new BlockedRateLimiterError(
            state,
            key,
            `Rate limiter for key "${key}" is blocked. All calls are being blocked until wait time is reached.`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `BlockedRateLimiterError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        /**
         * State that triggered the block.
         */
        public readonly state: Omit<RateLimiterBlockedState, "type">,
        /**
         * Key of the rate limiter that blocked the attempt.
         */
        readonly key: string,
        message?: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = BlockedRateLimiterError.name;
    }
}

/**
 * Thrown when the adapter fails unexpectedly while reading the rate limiter state.
 * The adapter error is preserved in `cause`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export class UnableToGetStateRateLimiterError extends Error {
    /**
     * Creates the error for `key`, preserving the adapter error in `cause`.
     */
    static create(
        key: string,
        cause?: unknown,
    ): UnableToGetStateRateLimiterError {
        return new UnableToGetStateRateLimiterError(
            key,
            `Unable to get state of rate limiter with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetStateRateLimiterError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        /**
         * Key of the rate limiter whose state could not be read.
         */
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToGetStateRateLimiterError.name;
    }
}

/**
 * Thrown when the adapter fails unexpectedly while recording an attempt.
 * The adapter error is preserved in `cause`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export class UnableToUpdateStateRateLimiterError extends Error {
    /**
     * Creates the error for `key`, preserving the adapter error in `cause`.
     */
    static create(
        key: string,
        cause?: unknown,
    ): UnableToUpdateStateRateLimiterError {
        return new UnableToUpdateStateRateLimiterError(
            key,
            `Unable to update state of rate limiter with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToUpdateStateRateLimiterError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        /**
         * Key of the rate limiter that could not record the attempt.
         */
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToUpdateStateRateLimiterError.name;
    }
}

/**
 * Thrown when the adapter fails unexpectedly while resetting the rate limiter.
 * The adapter error is preserved in `cause`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export class UnableToResetRateLimiterError extends Error {
    /**
     * Creates the error for `key`, preserving the adapter error in `cause`.
     */
    static create(key: string, cause?: unknown): UnableToResetRateLimiterError {
        return new UnableToResetRateLimiterError(
            key,
            `Unable to reset rate limiter with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToResetRateLimiterError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        /**
         * Key of the rate limiter that could not be reset.
         */
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToResetRateLimiterError.name;
    }
}

/**
 * Adapter failure errors, keyed by the operation that failed.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export const UNABLE_RATE_LIMITER_ERRORS = {
    UnableToGetState: UnableToGetStateRateLimiterError,
    UnableToUpdateState: UnableToUpdateStateRateLimiterError,
    UnableToReset: UnableToResetRateLimiterError,
} as const;

/**
 * Any error from {@link UNABLE_RATE_LIMITER_ERRORS | `UNABLE_RATE_LIMITER_ERRORS`}.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export type AllUnableRateLimiterErrors = InferInstance<
    (typeof UNABLE_RATE_LIMITER_ERRORS)[keyof typeof UNABLE_RATE_LIMITER_ERRORS]
>;

/**
 * Returns `true` when `value` is one of {@link AllUnableRateLimiterErrors | `AllUnableRateLimiterErrors`}.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export function isUnableToRateLimiterError(
    value: unknown,
): value is AllUnableRateLimiterErrors {
    for (const errorClass of Object.values(UNABLE_RATE_LIMITER_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}

/**
 * Every rate limiter error: {@link BlockedRateLimiterError | `BlockedRateLimiterError`} plus
 * {@link UNABLE_RATE_LIMITER_ERRORS | `UNABLE_RATE_LIMITER_ERRORS`}.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export const RATE_LIMITER_ERRORS = {
    Blocked: BlockedRateLimiterError,
    ...UNABLE_RATE_LIMITER_ERRORS,
} as const;

/**
 * Any error raised by the rate limiter.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export type AllRateLimiterErrors = InferInstance<
    (typeof RATE_LIMITER_ERRORS)[keyof typeof RATE_LIMITER_ERRORS]
>;

/**
 * Returns `true` when `value` is one of {@link AllRateLimiterErrors | `AllRateLimiterErrors`}.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export function isRateLimiterError(
    value: unknown,
): value is AllRateLimiterErrors {
    for (const errorClass of Object.values(RATE_LIMITER_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
