/**
 * @module SharedLock
 */

import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * The error is thrown when trying to acquire a semaphore slot, but all slots are already taken.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class LimitReachedReaderSemaphoreError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): LimitReachedReaderSemaphoreError {
        return new LimitReachedReaderSemaphoreError(
            key,
            `Key "${key}" has reached the limit`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `LimitReachedReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = LimitReachedReaderSemaphoreError.name;
    }
}

/**
 * The error is thrown when trying to refresh a semaphore slot that is already expired.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class FailedRefreshReaderSemaphoreError extends Error {
    static create(
        key: string,
        slotId: string,
        cause?: unknown,
    ): FailedRefreshReaderSemaphoreError {
        return new FailedRefreshReaderSemaphoreError(
            key,
            slotId,
            `Failed to refresh slot "${slotId}" of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedRefreshReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly slotId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = FailedRefreshReaderSemaphoreError.name;
    }
}

/**
 * The error is thrown when trying to release a semaphore slot that is already expired.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class FailedReleaseReaderSemaphoreError extends Error {
    static create(
        key: string,
        slotId: string,
        cause?: unknown,
    ): FailedReleaseReaderSemaphoreError {
        return new FailedReleaseReaderSemaphoreError(
            key,
            slotId,
            `Failed to release slot "${slotId}" of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedReleaseReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly slotId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = FailedReleaseReaderSemaphoreError.name;
    }
}

/**
 * The error is thrown when the underlying shared-lock adapter fails with an unexpected error while acquiring a reader slot.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class UnableToAcquireReaderSemaphoreError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToAcquireReaderSemaphoreError {
        return new UnableToAcquireReaderSemaphoreError(
            key,
            `Unable to acquire reader slot of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToAcquireReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToAcquireReaderSemaphoreError.name;
    }
}

/**
 * The error is thrown when the underlying shared-lock adapter fails with an unexpected error while releasing a reader slot.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class UnableToReleaseReaderSemaphoreError extends Error {
    static create(
        key: string,
        slotId: string,
        cause?: unknown,
    ): UnableToReleaseReaderSemaphoreError {
        return new UnableToReleaseReaderSemaphoreError(
            key,
            slotId,
            `Unable to release reader slot "${slotId}" of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToReleaseReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly slotId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToReleaseReaderSemaphoreError.name;
    }
}

/**
 * The error is thrown when the underlying shared-lock adapter fails with an unexpected error while refreshing a reader slot.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class UnableToRefreshReaderSemaphoreError extends Error {
    static create(
        key: string,
        slotId: string,
        cause?: unknown,
    ): UnableToRefreshReaderSemaphoreError {
        return new UnableToRefreshReaderSemaphoreError(
            key,
            slotId,
            `Unable to refresh reader slot "${slotId}" of key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToRefreshReaderSemaphoreError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly slotId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToRefreshReaderSemaphoreError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export const UNABLE_READER_SEMAPHORE_ERRORS = {
    UnableToAcquireReader: UnableToAcquireReaderSemaphoreError,
    UnableToReleaseReader: UnableToReleaseReaderSemaphoreError,
    UnableToRefreshReader: UnableToRefreshReaderSemaphoreError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export type AllUnableReaderSemaphoreErrors = InferInstance<
    (typeof UNABLE_READER_SEMAPHORE_ERRORS)[keyof typeof UNABLE_READER_SEMAPHORE_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export function isUnableToReaderSemaphoreError(
    value: unknown,
): value is AllUnableReaderSemaphoreErrors {
    for (const errorClass of Object.values(UNABLE_READER_SEMAPHORE_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export const READER_SEMAPHORE_ERRORS = {
    ReachedLimitReader: LimitReachedReaderSemaphoreError,
    FailedRefreshReader: FailedRefreshReaderSemaphoreError,
    FailedReleaseReader: FailedReleaseReaderSemaphoreError,
    ...UNABLE_READER_SEMAPHORE_ERRORS,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export type AllReaderSemaphoreErrors = InferInstance<
    (typeof READER_SEMAPHORE_ERRORS)[keyof typeof READER_SEMAPHORE_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export function isReaderSemaphoreError(
    value: unknown,
): value is AllReaderSemaphoreErrors {
    for (const errorClass of Object.values(READER_SEMAPHORE_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}

/**
 * The error is thrown when trying to acquire a shared-lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class FailedAcquireWriterLockError extends Error {
    static create(key: string, cause?: unknown): FailedAcquireWriterLockError {
        return new FailedAcquireWriterLockError(
            key,
            `Key "${key}" already acquired`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedAcquireWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = FailedAcquireWriterLockError.name;
    }
}

/**
 * The error is thrown when trying to release a shared-lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class FailedReleaseWriterLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): FailedReleaseWriterLockError {
        return new FailedReleaseWriterLockError(
            key,
            lockId,
            `Unonwed release on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedReleaseWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly lockId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = FailedReleaseWriterLockError.name;
    }
}

/**
 * The error is thrown when trying to refresh a shared-lock that is owned by a different owner.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class FailedRefreshWriterLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): FailedRefreshWriterLockError {
        return new FailedRefreshWriterLockError(
            key,
            lockId,
            `Unonwed refresh on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `FailedRefreshWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly lockId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = FailedRefreshWriterLockError.name;
    }
}

/**
 * The error is thrown when the underlying shared-lock adapter fails with an unexpected error while acquiring a writer lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class UnableToAcquireWriterLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): UnableToAcquireWriterLockError {
        return new UnableToAcquireWriterLockError(
            key,
            lockId,
            `Unable to acquire writer lock on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToAcquireWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly lockId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToAcquireWriterLockError.name;
    }
}

/**
 * The error is thrown when the underlying shared-lock adapter fails with an unexpected error while releasing a writer lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class UnableToReleaseWriterLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): UnableToReleaseWriterLockError {
        return new UnableToReleaseWriterLockError(
            key,
            lockId,
            `Unable to release writer lock on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToReleaseWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly lockId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToReleaseWriterLockError.name;
    }
}

/**
 * The error is thrown when the underlying shared-lock adapter fails with an unexpected error while refreshing a writer lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class UnableToRefreshWriterLockError extends Error {
    static create(
        key: string,
        lockId: string,
        cause?: unknown,
    ): UnableToRefreshWriterLockError {
        return new UnableToRefreshWriterLockError(
            key,
            lockId,
            `Unable to refresh writer lock on key "${key}" by owner "${lockId}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToRefreshWriterLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        readonly lockId: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToRefreshWriterLockError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export const UNABLE_WRITER_LOCK_ERRORS = {
    UnableToAcquireWriter: UnableToAcquireWriterLockError,
    UnableToReleaseWriter: UnableToReleaseWriterLockError,
    UnableToRefreshWriter: UnableToRefreshWriterLockError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export type AllUnableWriterLockErrors = InferInstance<
    (typeof UNABLE_WRITER_LOCK_ERRORS)[keyof typeof UNABLE_WRITER_LOCK_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export function isUnableToWriterLockError(
    value: unknown,
): value is AllUnableWriterLockErrors {
    for (const errorClass of Object.values(UNABLE_WRITER_LOCK_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export const WRITER_LOCK_ERRORS = {
    FailedAcquireWriter: FailedAcquireWriterLockError,
    FailedReleaseWriter: FailedReleaseWriterLockError,
    FailedRefreshWriter: FailedRefreshWriterLockError,
    ...UNABLE_WRITER_LOCK_ERRORS,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export type AllWriterLockErrors = InferInstance<
    (typeof WRITER_LOCK_ERRORS)[keyof typeof WRITER_LOCK_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export function isWriterLockError(
    value: unknown,
): value is AllWriterLockErrors {
    for (const errorClass of Object.values(WRITER_LOCK_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}

/**
 * The error is thrown when the underlying shared-lock adapter fails with an unexpected error while force releasing the shared lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class UnableToForceReleaseSharedLockError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToForceReleaseSharedLockError {
        return new UnableToForceReleaseSharedLockError(
            key,
            `Unable to force release shared lock on key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToForceReleaseSharedLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToForceReleaseSharedLockError.name;
    }
}

/**
 * The error is thrown when the underlying shared-lock adapter fails with an unexpected error while retrieving the state of a shared lock.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export class UnableToGetStateSharedLockError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToGetStateSharedLockError {
        return new UnableToGetStateSharedLockError(
            key,
            `Unable to get state of shared lock with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetStateSharedLockError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(
        readonly key: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, { cause });
        this.name = UnableToGetStateSharedLockError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export const UNABLE_SHARED_LOCK_ERRORS = {
    ...UNABLE_READER_SEMAPHORE_ERRORS,
    ...UNABLE_WRITER_LOCK_ERRORS,
    UnableToForceRelease: UnableToForceReleaseSharedLockError,
    UnableToGetState: UnableToGetStateSharedLockError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export type AllUnableSharedLockErrors = InferInstance<
    (typeof UNABLE_SHARED_LOCK_ERRORS)[keyof typeof UNABLE_SHARED_LOCK_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export function isUnableToSharedLockError(
    value: unknown,
): value is AllUnableSharedLockErrors {
    return (
        isUnableToReaderSemaphoreError(value) ||
        isUnableToWriterLockError(value) ||
        value instanceof UnableToForceReleaseSharedLockError ||
        value instanceof UnableToGetStateSharedLockError
    );
}

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export const SHARED_LOCK_ERRORS = {
    ...READER_SEMAPHORE_ERRORS,
    ...WRITER_LOCK_ERRORS,
    ...UNABLE_SHARED_LOCK_ERRORS,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export type AllSharedLockErrors = InferInstance<
    (typeof SHARED_LOCK_ERRORS)[keyof typeof SHARED_LOCK_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Errors
 */
export function isSharedLockError(
    value: unknown,
): value is AllSharedLockErrors {
    return (
        isReaderSemaphoreError(value) ||
        isWriterLockError(value) ||
        value instanceof UnableToForceReleaseSharedLockError ||
        value instanceof UnableToGetStateSharedLockError
    );
}
