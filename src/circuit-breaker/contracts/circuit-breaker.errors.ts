/**
 * @module CircuitBreaker
 */

import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * The error is thrown when circuit breaker is in open state and will not allow any attempts.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export class OpenCircuitBreakerError extends Error {
    static create(key: string, cause?: unknown): OpenCircuitBreakerError {
        return new OpenCircuitBreakerError(
            `Circuit breaker for key "${key}" is in opened state. All calls are being blocked until transitioned to half opened state.`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `OpenCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = OpenCircuitBreakerError.name;
    }
}

export class IsolatedCircuitBreakerError extends Error {
    static create(key: string, cause?: unknown): IsolatedCircuitBreakerError {
        return new IsolatedCircuitBreakerError(
            `Circuit breaker for key "${key}" is manually isolated. All calls are being blocked until reseted.`,
            cause,
            // Circuit breaker "a" is manually isolated; all requests are being blocked.
        );
    }

    /**
     * Note: Do not instantiate `IsolatedCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = IsolatedCircuitBreakerError.name;
    }
}

/**
 * The error is thrown when the underlying circuit breaker adapter fails with an unexpected error while retrieving the state.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export class UnableToGetStateCircuitBreakerError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToGetStateCircuitBreakerError {
        return new UnableToGetStateCircuitBreakerError(
            `Unable to get state of circuit breaker with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetStateCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetStateCircuitBreakerError.name;
    }
}

/**
 * The error is thrown when the underlying circuit breaker adapter fails with an unexpected error while updating the state.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export class UnableToUpdateStateCircuitBreakerError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToUpdateStateCircuitBreakerError {
        return new UnableToUpdateStateCircuitBreakerError(
            `Unable to update state of circuit breaker with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToUpdateStateCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToUpdateStateCircuitBreakerError.name;
    }
}

/**
 * The error is thrown when the underlying circuit breaker adapter fails with an unexpected error while isolating the circuit breaker.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export class UnableToIsolateCircuitBreakerError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToIsolateCircuitBreakerError {
        return new UnableToIsolateCircuitBreakerError(
            `Unable to isolate circuit breaker with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToIsolateCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToIsolateCircuitBreakerError.name;
    }
}

/**
 * The error is thrown when the underlying circuit breaker adapter fails with an unexpected error while tracking a failure.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export class UnableToTrackFailureCircuitBreakerError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToTrackFailureCircuitBreakerError {
        return new UnableToTrackFailureCircuitBreakerError(
            `Unable to track failure of circuit breaker with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToTrackFailureCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToTrackFailureCircuitBreakerError.name;
    }
}

/**
 * The error is thrown when the underlying circuit breaker adapter fails with an unexpected error while tracking a success.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export class UnableToTrackSuccessCircuitBreakerError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToTrackSuccessCircuitBreakerError {
        return new UnableToTrackSuccessCircuitBreakerError(
            `Unable to track success of circuit breaker with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToTrackSuccessCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToTrackSuccessCircuitBreakerError.name;
    }
}

/**
 * The error is thrown when the underlying circuit breaker adapter fails with an unexpected error while resetting the circuit breaker.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export class UnableToResetCircuitBreakerError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToResetCircuitBreakerError {
        return new UnableToResetCircuitBreakerError(
            `Unable to reset circuit breaker with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToResetCircuitBreakerError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToResetCircuitBreakerError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export const CIRCUIT_BREAKER_ERRORS = {
    Open: OpenCircuitBreakerError,
    Isolated: IsolatedCircuitBreakerError,
    UnableToGetState: UnableToGetStateCircuitBreakerError,
    UnableToUpdateState: UnableToUpdateStateCircuitBreakerError,
    UnableToIsolate: UnableToIsolateCircuitBreakerError,
    UnableToTrackFailure: UnableToTrackFailureCircuitBreakerError,
    UnableToTrackSuccess: UnableToTrackSuccessCircuitBreakerError,
    UnableToReset: UnableToResetCircuitBreakerError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export type AllCircuitBreakerErrors = InferInstance<
    (typeof CIRCUIT_BREAKER_ERRORS)[keyof typeof CIRCUIT_BREAKER_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/contracts"`
 * @group Errors
 */
export function isCircuitBreakerError(
    value: unknown,
): value is AllCircuitBreakerErrors {
    for (const errorClass of Object.values(CIRCUIT_BREAKER_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
