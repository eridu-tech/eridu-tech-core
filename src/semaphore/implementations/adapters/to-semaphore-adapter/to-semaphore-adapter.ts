/**
 * @module Semaphore
 */

import type {
    ISemaphoreAdapter,
    ISemaphoreAdapterState,
    SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module-exports.js";
import type {
    ISharedLockAdapter,
    ISharedLockAdapterState,
} from "@/shared-lock/contracts/_module-exports.js";

/**
 * Adapts an {@link ISharedLockAdapter} into an {@link ISemaphoreAdapter} by using
 * the reader side of the shared lock.
 *
 * Each semaphore slot is stored as a reader slot: `slotId` becomes the reader
 * `lockId` and `limit` is forwarded to the shared lock. `forceReleaseAll`
 * releases the entire shared lock, and `getState` reports the reader semaphore,
 * so a shared lock held by a writer is reported as `null`.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/to-semaphore-adapter"`
 * @group Adapters
 */
export class ToSemaphoreAdapter implements ISemaphoreAdapter {
    constructor(private readonly adapter: ISharedLockAdapter) {}

    acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { slotId, ...rest } = settings;
        return this.adapter.acquireReader({
            ...rest,
            lockId: slotId,
        });
    }

    release(key: string, slotId: string): Promise<boolean> {
        return this.adapter.releaseReader(key, slotId);
    }

    forceReleaseAll(key: string): Promise<boolean> {
        return this.adapter.forceRelease(key);
    }

    refresh(key: string, slotId: string, ttl: Date): Promise<boolean> {
        return this.adapter.refreshReader(key, slotId, ttl);
    }

    private static toSemaphoreState(
        sharedLockState: ISharedLockAdapterState | null,
    ): ISemaphoreAdapterState | null {
        return sharedLockState?.reader ?? null;
    }

    async getState(key: string): Promise<ISemaphoreAdapterState | null> {
        return ToSemaphoreAdapter.toSemaphoreState(
            await this.adapter.getState(key),
        );
    }
}
