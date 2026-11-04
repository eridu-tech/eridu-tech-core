/**
 * @module RateLimiter
 */

import type { RateLimiterBlockedState } from "@/rate-limiter/contracts/rate-limiter-state.contract.js";
import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * The error is throw when rate limiter blocks the attempts.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export class BlockedRateLimiterError extends Error {
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
        public readonly state: Omit<RateLimiterBlockedState, "type">,
        readonly key: string,
        message?: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = BlockedRateLimiterError.name;
    }
}

/**
 * The error is thrown when the underlying rate limiter adapter fails with an unexpected error while retrieving the state.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export class UnableToGetStateRateLimiterError extends Error {
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
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToGetStateRateLimiterError.name;
    }
}

/**
 * The error is thrown when the underlying rate limiter adapter fails with an unexpected error while updating the state.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export class UnableToUpdateStateRateLimiterError extends Error {
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
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToUpdateStateRateLimiterError.name;
    }
}

/**
 * The error is thrown when the underlying rate limiter adapter fails with an unexpected error while resetting the rate limiter.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export class UnableToResetRateLimiterError extends Error {
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
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToResetRateLimiterError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export const UNABLE_RATE_LIMITER_ERRORS = {
    UnableToGetState: UnableToGetStateRateLimiterError,
    UnableToUpdateState: UnableToUpdateStateRateLimiterError,
    UnableToReset: UnableToResetRateLimiterError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export type AllUnableRateLimiterErrors = InferInstance<
    (typeof UNABLE_RATE_LIMITER_ERRORS)[keyof typeof UNABLE_RATE_LIMITER_ERRORS]
>;

/**
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
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export const RATE_LIMITER_ERRORS = {
    Blocked: BlockedRateLimiterError,
    ...UNABLE_RATE_LIMITER_ERRORS,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Errors
 */
export type AllRateLimiterErrors = InferInstance<
    (typeof RATE_LIMITER_ERRORS)[keyof typeof RATE_LIMITER_ERRORS]
>;

/**
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
