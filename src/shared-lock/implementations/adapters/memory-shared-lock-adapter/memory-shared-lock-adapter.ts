/**
 * @module SharedLock
 */

import { UnexpectedError } from "@/utilities/_module.js";

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ISharedLockFactory,
    ISharedLockAdapter,
    ISharedLockAdapterState,
    SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module.js";
import type { TimeSpan } from "@/time-span/implementations/_module.js";
import type { IDeinitizable, IPrunable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedWriterLockEntryData = {
    owner: string;
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedReaderSemaphoreSlotEntryData = {
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedReaderSemaphoreEntryData = {
    limit: number;
    slots: Map<string, MemorySharedReaderSemaphoreSlotEntryData>;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export type MemorySharedLockData = {
    writerLock: MemorySharedWriterLockEntryData | null;
    readerSemaphore: MemorySharedReaderSemaphoreEntryData | null;
};

/**
 * Note the `MemorySharedLockAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for easily faking{@link ISharedLockFactory | `ISharedLockFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/memory-shared-lock-adapter"`
 * @group Adapters
 */
export class MemorySharedLockAdapter
    implements ISharedLockAdapter, IDeinitizable, IPrunable
{
    /**
     *  @example
     * ```ts
     * import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
     *
     * const sharedLockAdapter = new MemorySharedLockAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
     *
     * const map = new Map<string, any>();
     * const sharedLockAdapter = new MemorySharedLockAdapter(map);
     * ```
     */
    constructor(
        private readonly map = new Map<string, MemorySharedLockData>(),
    ) {}

    private getWriter(key: string): MemorySharedWriterLockEntryData | null {
        const sharedLockEntry = this.map.get(key);
        if (sharedLockEntry === undefined) {
            return null;
        }
        const { writerLock, readerSemaphore } = sharedLockEntry;
        if (readerSemaphore !== null && writerLock !== null) {
            throw new UnexpectedError("!!__MESSAGE__!!");
        }
        if (readerSemaphore !== null) {
            return null;
        }
        if (writerLock === null) {
            return null;
        }
        if (writerLock.expiration === null) {
            return writerLock;
        }
        if (writerLock.expiration <= new Date()) {
            return null;
        }
        return writerLock;
    }

    private hasWriter(key: string): boolean {
        const writerLock = this.getWriter(key);
        return writerLock !== null;
    }

    private getReader(
        key: string,
    ): MemorySharedReaderSemaphoreEntryData | null {
        throw new Error("Method not implemented.");
    }

    removeAllExpired(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    acquireWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan | null,
        _context: IReadableContext,
    ): Promise<boolean> {
        const existingEntry = this.getWriter(key);
        if (existingEntry !== null && existingEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        this.map.set(key, {
            readerSemaphore: null,
            writerLock: {
                owner: lockId,
                expiration: ttl?.toEndDate() ?? null,
            },
        });
        return Promise.resolve(true);
    }

    releaseWriter(
        key: string,
        lockId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.getWriter(key);
        if (lockEntry === null) {
            return Promise.resolve(false);
        }
        if (lockEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        this.map.delete(key);
        return Promise.resolve(true);
    }

    forceReleaseWriter(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.getWriter(key);
        if (lockEntry === null) {
            return Promise.resolve(false);
        }
        this.map.delete(key);
        return Promise.resolve(true);
    }

    refreshWriter(
        key: string,
        lockId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        const lockEntry = this.getWriter(key);
        if (lockEntry === null) {
            return Promise.resolve(false);
        }
        if (lockEntry.owner !== lockId) {
            return Promise.resolve(false);
        }
        if (lockEntry.expiration === null) {
            return Promise.resolve(false);
        }
        this.map.set(key, {
            readerSemaphore: null,
            writerLock: {
                ...lockEntry,
                expiration: ttl.toEndDate(),
            },
        });
        return Promise.resolve(true);
    }

    private static isSlotNotExpired(
        slot: MemorySharedReaderSemaphoreSlotEntryData,
    ): boolean {
        return slot.expiration === null || slot.expiration > new Date();
    }

    private removeExpiredSlots(
        entry: MemorySharedReaderSemaphoreEntryData,
    ): void {
        for (const [slotId, slot] of entry.slots) {
            if (MemorySharedLockAdapter.isSlotNotExpired(slot)) {
                continue;
            }
            entry.slots.delete(slotId);
        }
    }

    acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    releaseReader(
        key: string,
        slotId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    forceReleaseAllReaders(
        key: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    refreshReader(
        key: string,
        slotId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    forceRelease(key: string, _context: IReadableContext): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    getState(
        key: string,
        _context: IReadableContext,
    ): Promise<ISharedLockAdapterState | null> {
        throw new Error("Method not implemented.");
    }
}
