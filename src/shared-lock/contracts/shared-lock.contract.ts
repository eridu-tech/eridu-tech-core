/**
 * @module SharedLock
 */

import type { ISharedLockState } from "@/shared-lock/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { TimeSpan } from "@/time-span/implementations/_module-exports.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { AsyncLazy, Invocable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Contracts
 */
export type IReaderSemaphore = {
    /**
     * The `runReaderOrFail` method wraps an {@link Invocable | `Invocable`} with the `acquireOrFail` and `release` method.
     * @throws {LimitReachedReaderSemaphoreError}
     * @throws {UnableToAcquireReaderSemaphoreError} If the shared-lock adapter fails with an unexpected error while acquiring a reader slot
     * @throws {UnableToReleaseReaderSemaphoreError} If the shared-lock adapter fails with an unexpected error while releasing the reader slot after the function completes
     */
    runReaderOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue>;

    /**
     * The `acquireReader` method acquires an slots only if the slot limit is not reached.
     *
     * @returns Returns true if the slot limit is not reached otherwise false is returned.
     * @throws {UnableToAcquireReaderSemaphoreError} If the shared-lock adapter fails with an unexpected error while acquiring a reader slot
     */
    acquireReader(): Promise<boolean>;

    /**
     * The `acquireReaderOrFail` method acquires an slots only if the slot limit is not reached.
     * Throws an error if the slot limit is reached.
     *
     * @throws {LimitReachedReaderSemaphoreError}
     * @throws {UnableToAcquireReaderSemaphoreError} If the shared-lock adapter fails with an unexpected error while acquiring a reader slot
     */
    acquireReaderOrFail(): Promise<void>;

    /**
     * The `releaseReader` method releases the current slot.
     *
     * @returns Returns true if the semaphore exists and has at least one busy slot or false.
     * @throws {UnableToReleaseReaderSemaphoreError} If the shared-lock adapter fails with an unexpected error while releasing the reader slot
     */
    releaseReader(): Promise<boolean>;

    /**
     * The `releaseReaderOrFail` method releases the current slot.
     * Throws an error if the slot is not acquired.
     * @throws {FailedReleaseReaderSemaphoreError}
     * @throws {UnableToReleaseReaderSemaphoreError} If the shared-lock adapter fails with an unexpected error while releasing the reader slot
     */
    releaseReaderOrFail(): Promise<void>;

    /**
     * The `refreshReader` method updates the `ttl` of the slot when acquired.
     *
     * @returns Returns true if the slot is refreshed otherwise false is returned.
     * @throws {UnableToRefreshReaderSemaphoreError} If the shared-lock adapter fails with an unexpected error while refreshing the reader slot
     */
    refreshReader(ttl?: ITimeSpan): Promise<boolean>;

    /**
     * The `refreshReaderOrFail` method updates the `ttl` of the slot when acquired.
     * Throws an error if the slot is not acquired.
     * @throws {FailedRefreshReaderSemaphoreError}
     * @throws {UnableToRefreshReaderSemaphoreError} If the shared-lock adapter fails with an unexpected error while refreshing the reader slot
     */
    refreshReaderOrFail(ttl?: ITimeSpan): Promise<void>;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Contracts
 */
export type IWriterLock = {
    /**
     * The `runWriterOrFail` method wraps an {@link Invocable | `Invocable`} with the `acquireOrFail` and `release` method.
     * @throws {FailedAcquireWriterLockError}
     * @throws {UnableToAcquireWriterLockError} If the shared-lock adapter fails with an unexpected error while acquiring a writer lock
     * @throws {UnableToReleaseWriterLockError} If the shared-lock adapter fails with an unexpected error while releasing the writer lock after the function completes
     */
    runWriterOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue>;

    /**
     * The `acquireWriter` method acquires a lock only if the key is not already acquired by different owner.
     *
     * @returns Returns true if the lock is not already acquired otherwise false is returned.
     * @throws {UnableToAcquireWriterLockError} If the shared-lock adapter fails with an unexpected error while acquiring a writer lock
     */
    acquireWriter(): Promise<boolean>;

    /**
     * The `acquireWriterOrFail` method acquires a lock only if the key is not already acquired by different owner.
     * Throws an error if the lock is already acquired by different owner.
     *
     * @throws {FailedAcquireWriterLockError}
     * @throws {UnableToAcquireWriterLockError} If the shared-lock adapter fails with an unexpected error while acquiring a writer lock
     */
    acquireWriterOrFail(): Promise<void>;

    /**
     * The `releaseWriter` method releases a lock if owned by the same owner.
     *
     * @returns Returns true if the lock is released otherwise false is returned.
     * @throws {UnableToReleaseWriterLockError} If the shared-lock adapter fails with an unexpected error while releasing the writer lock
     */
    releaseWriter(): Promise<boolean>;

    /**
     * The `releaseWriterOrFail` method releases a lock if owned by the same owner.
     * Throws an error if the lock is not owned by same owner.
     *
     * @throws {FailedReleaseWriterLockError}
     * @throws {UnableToReleaseWriterLockError} If the shared-lock adapter fails with an unexpected error while releasing the writer lock
     */
    releaseWriterOrFail(): Promise<void>;

    /**
     * The `refreshWriter` method updates the `ttl` of the lock if expireable and owned by the same owner.
     *
     * @returns Returns true if the lock is refreshed otherwise false is returned.
     * @throws {UnableToRefreshWriterLockError} If the shared-lock adapter fails with an unexpected error while refreshing the writer lock
     */
    refreshWriter(ttl?: ITimeSpan): Promise<boolean>;

    /**
     * The `refreshWriterOrFail` method updates the `ttl` of the lock if expireable and owned by the same owner.
     * Throws an error if the lock is not owned by same owner.
     * Throws an error if the key is unexpirable.
     *
     * @throws {FailedRefreshWriterLockError}
     * @throws {UnableToRefreshWriterLockError} If the shared-lock adapter fails with an unexpected error while refreshing the writer lock
     */
    refreshWriterOrFail(ttl?: ITimeSpan): Promise<void>;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockStateMethods = {
    /**
     * @throws {UnableToGetStateSharedLockError} If the shared-lock adapter fails with an unexpected error while retrieving the shared lock state
     */
    getState(): Promise<ISharedLockState>;

    /**
     * The `key` of the `ISharedLock` instance.
     */
    readonly key: string;

    /**
     * The `id` of the `ISharedLock` instance.
     */
    readonly id: string;

    /**
     * The `ttl` of `ISharedLock` instance.
     */
    readonly ttl: TimeSpan | null;

    /**
     * Maximum number of active reader slots allowed for this shared lock.
     */
    readonly limit: number;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLockBase = IReaderSemaphore &
    IWriterLock & {
        /**
         * @throws {UnableToForceReleaseSharedLockError} If the shared-lock adapter fails with an unexpected error while force releasing the shared lock
         */
        forceRelease(): Promise<boolean>;
    };

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/contracts"`
 * @group Contracts
 */
export type ISharedLock = ISharedLockBase & ISharedLockStateMethods;
