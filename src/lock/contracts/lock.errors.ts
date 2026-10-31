/**
 * @module Lock
 */

import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * The error is thrown when trying to acquire a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export class FailedAcquireLockError extends Error {
    static create(key: string, cause?: unknown): FailedAcquireLockError {
        return new FailedAcquireLockError(
            `Key "${key}" already acquired`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedAcquireLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedAcquireLockError.name;
    }
}

/**
 * The error is thrown when trying to release a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export class FailedReleaseLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): FailedReleaseLockError {
        return new FailedReleaseLockError(
            `Unonwed release on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedReleaseLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedReleaseLockError.name;
    }
}

/**
 * The error is thrown when trying to refresh a lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export class FailedRefreshLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): FailedRefreshLockError {
        return new FailedRefreshLockError(
            `Unonwed refresh on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedRefreshLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = FailedRefreshLockError.name;
    }
}

/**
 * The error is thrown when the underlying lock adapter fails with an unexpected error while acquiring a lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export class UnableToAcquireLockError extends Error {
    static create(key: string, cause?: unknown): UnableToAcquireLockError {
        return new UnableToAcquireLockError(
            `Unable to acquire lock on key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToAcquireLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToAcquireLockError.name;
    }
}

/**
 * The error is thrown when the underlying lock adapter fails with an unexpected error while releasing a lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export class UnableToReleaseLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): UnableToReleaseLockError {
        return new UnableToReleaseLockError(
            `Unable to release lock on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToReleaseLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToReleaseLockError.name;
    }
}

/**
 * The error is thrown when the underlying lock adapter fails with an unexpected error while force releasing a lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export class UnableToForceReleaseLockError extends Error {
    static create(key: string, cause?: unknown): UnableToForceReleaseLockError {
        return new UnableToForceReleaseLockError(
            `Unable to force release lock on key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToForceReleaseLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToForceReleaseLockError.name;
    }
}

/**
 * The error is thrown when the underlying lock adapter fails with an unexpected error while refreshing a lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export class UnableToRefreshLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): UnableToRefreshLockError {
        return new UnableToRefreshLockError(
            `Unable to refresh lock on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToRefreshLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRefreshLockError.name;
    }
}

/**
 * The error is thrown when the underlying lock adapter fails with an unexpected error while retrieving the state of a lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export class UnableToGetStateLockError extends Error {
    static create(key: string, cause?: unknown): UnableToGetStateLockError {
        return new UnableToGetStateLockError(
            `Unable to get state of lock on key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetStateLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetStateLockError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export const LOCK_ERRORS = {
    FailedAcquire: FailedAcquireLockError,
    FailedRelease: FailedReleaseLockError,
    FailedRefresh: FailedRefreshLockError,
    UnableToAcquire: UnableToAcquireLockError,
    UnableToRelease: UnableToReleaseLockError,
    UnableToForceRelease: UnableToForceReleaseLockError,
    UnableToRefresh: UnableToRefreshLockError,
    UnableToGetState: UnableToGetStateLockError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export type AllLockErrors = InferInstance<
    (typeof LOCK_ERRORS)[keyof typeof LOCK_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/lock/contracts"`
 * @group Errors
 */
export function isLockError(value: unknown): value is AllLockErrors {
    for (const errorClass of Object.values(LOCK_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
