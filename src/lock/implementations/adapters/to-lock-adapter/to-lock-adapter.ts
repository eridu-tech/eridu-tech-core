/**
 * @module Lock
 */

import type {
    ILockAdapter,
    ILockAdapterState,
} from "@/lock/contracts/_module-exports.js";
import type {
    ISharedLockAdapter,
    ISharedLockAdapterState,
} from "@/shared-lock/contracts/_module-exports.js";

/**
 * Adapts an {@link ISharedLockAdapter} into an {@link ILockAdapter} by using the
 * writer side of the shared lock.
 *
 * `acquire`, `release` and `refresh` map to `acquireWriter`, `releaseWriter` and
 * `refreshWriter`, while `forceRelease` releases the entire shared lock.
 * `getState` reports the writer lock, so a shared lock held only by readers is
 * reported as `null`.
 *
 * IMPORT_PATH: `"eridu-tech/lock/to-lock-adapter"`
 * @group Adapters
 */
export class ToLockAdapter implements ILockAdapter {
    constructor(private readonly adapter: ISharedLockAdapter) {}

    acquire(key: string, lockId: string, ttl: Date | null): Promise<boolean> {
        return this.adapter.acquireWriter(key, lockId, ttl);
    }

    release(key: string, lockId: string): Promise<boolean> {
        return this.adapter.releaseWriter(key, lockId);
    }

    forceRelease(key: string): Promise<boolean> {
        return this.adapter.forceRelease(key);
    }

    refresh(key: string, lockId: string, ttl: Date): Promise<boolean> {
        return this.adapter.refreshWriter(key, lockId, ttl);
    }

    private static toLockState(
        sharedLockState: ISharedLockAdapterState | null,
    ): ILockAdapterState | null {
        return sharedLockState?.writer ?? null;
    }

    async getState(key: string): Promise<ILockAdapterState | null> {
        return ToLockAdapter.toLockState(await this.adapter.getState(key));
    }
}
