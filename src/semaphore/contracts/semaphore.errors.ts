/**
 * @module Semaphore
 */

import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * The error is thrown when trying to acquire a semaphore slot, but all slots are already taken.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export class LimitReachedSemaphoreError extends Error {
    static create(key: string, cause?: unknown): LimitReachedSemaphoreError {
        return new LimitReachedSemaphoreError(
            `Key "${key}" has reached the limit`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `LimitReachedSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = LimitReachedSemaphoreError.name;
    }
}

/**
 * The error is thrown when trying to refresh a semaphore slot that is already expired.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export class FailedRefreshSemaphoreError extends Error {
    static create(
        key: string,
        slotId: string,
        cause?: unknown,
    ): FailedRefreshSemaphoreError {
        return new FailedRefreshSemaphoreError(
            `Failed to refresh slot "${slotId}" of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedRefreshSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedRefreshSemaphoreError.name;
    }
}

/**
 * The error is thrown when trying to release a semaphore slot that is already expired.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export class FailedReleaseSemaphoreError extends Error {
    static create(
        key: string,
        slotId: string,
        cause?: unknown,
    ): FailedReleaseSemaphoreError {
        return new FailedReleaseSemaphoreError(
            `Failed to release slot "${slotId}" of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedReleaseSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedReleaseSemaphoreError.name;
    }
}

/**
 * The error is thrown when the underlying semaphore adapter fails with an unexpected error while acquiring a slot.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export class UnableToAcquireSemaphoreError extends Error {
    static create(key: string, cause?: unknown): UnableToAcquireSemaphoreError {
        return new UnableToAcquireSemaphoreError(
            `Unable to acquire slot of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToAcquireSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToAcquireSemaphoreError.name;
    }
}

/**
 * The error is thrown when the underlying semaphore adapter fails with an unexpected error while releasing a slot.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export class UnableToReleaseSemaphoreError extends Error {
    static create(
        key: string,
        slotId: string,
        cause?: unknown,
    ): UnableToReleaseSemaphoreError {
        return new UnableToReleaseSemaphoreError(
            `Unable to release slot "${slotId}" of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToReleaseSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToReleaseSemaphoreError.name;
    }
}

/**
 * The error is thrown when the underlying semaphore adapter fails with an unexpected error while force releasing all slots.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export class UnableToForceReleaseAllSemaphoreError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToForceReleaseAllSemaphoreError {
        return new UnableToForceReleaseAllSemaphoreError(
            `Unable to force release all slots of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToForceReleaseAllSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToForceReleaseAllSemaphoreError.name;
    }
}

/**
 * The error is thrown when the underlying semaphore adapter fails with an unexpected error while refreshing a slot.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export class UnableToRefreshSemaphoreError extends Error {
    static create(
        key: string,
        slotId: string,
        cause?: unknown,
    ): UnableToRefreshSemaphoreError {
        return new UnableToRefreshSemaphoreError(
            `Unable to refresh slot "${slotId}" of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToRefreshSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRefreshSemaphoreError.name;
    }
}

/**
 * The error is thrown when the underlying semaphore adapter fails with an unexpected error while retrieving the state of a semaphore.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export class UnableToGetStateSemaphoreError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToGetStateSemaphoreError {
        return new UnableToGetStateSemaphoreError(
            `Unable to get state of semaphore with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetStateSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetStateSemaphoreError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export const SEMAPHORE_ERRORS = {
    ReachedLimit: LimitReachedSemaphoreError,
    FailedRefresh: FailedRefreshSemaphoreError,
    FailedRelease: FailedReleaseSemaphoreError,
    UnableToAcquire: UnableToAcquireSemaphoreError,
    UnableToRelease: UnableToReleaseSemaphoreError,
    UnableToForceReleaseAll: UnableToForceReleaseAllSemaphoreError,
    UnableToRefresh: UnableToRefreshSemaphoreError,
    UnableToGetState: UnableToGetStateSemaphoreError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export type AllSemaphoreErrors = InferInstance<
    (typeof SEMAPHORE_ERRORS)[keyof typeof SEMAPHORE_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/contracts"`
 * @group Errors
 */
export function isSemaphoreError(value: unknown): value is AllSemaphoreErrors {
    for (const errorClass of Object.values(SEMAPHORE_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
