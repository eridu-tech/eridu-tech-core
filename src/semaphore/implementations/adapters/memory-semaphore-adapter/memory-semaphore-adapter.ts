/**
 * @module Semaphore
 */

import type { IReadableContext } from "@/execution-context/contracts/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ISemaphoreFactory,
    ISemaphoreAdapter,
    ISemaphoreAdapterState,
    SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import type { TimeSpan } from "@/time-span/implementations/_module.js";
import type { IDeinitizable, IPrunable } from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/memory-semaphore-adapter"`
 * @group Adapters
 */
export type MemorySemaphoreSlotEntry = {
    expiration: Date | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/memory-semaphore-adapter"`
 * @group Adapters
 */
export type MemorySemaphoreEntryData = {
    limit: number;
    slots: Map<string, MemorySemaphoreSlotEntry>;
};

/**
 * Note the `MemorySemaphoreAdapter` is limited to single process usage and cannot be shared across multiple servers or different processes.
 * This adapter is meant for easily faking{@link ISemaphoreFactory | `ISemaphoreFactory`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/memory-semaphore-adapter"`
 * @group Adapters
 */
export class MemorySemaphoreAdapter
    implements ISemaphoreAdapter, IDeinitizable, IPrunable
{
    /**
     *  @example
     * ```ts
     * import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
     *
     * const semaphoreAdapter = new MemorySemaphoreAdapter();
     * ```
     * You can also provide an `Map`.
     * @example
     * ```ts
     * import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
     *
     * const map = new Map<string, any>();
     * const semaphoreAdapter = new MemorySemaphoreAdapter(map);
     * ```
     */
    constructor(
        private readonly map = new Map<string, MemorySemaphoreEntryData>(),
    ) {}

    private static isSlotExpired(slot: MemorySemaphoreSlotEntry): boolean {
        return slot.expiration === null || slot.expiration > new Date();
    }

    private static removeExpiredSlots(entry: MemorySemaphoreEntryData): void {
        for (const [slotId, slot] of entry.slots) {
            if (MemorySemaphoreAdapter.isSlotNotExpired(slot)) {
                continue;
            }
            entry.slots.delete(slotId);
        }
    }

    private get(key: string): MemorySemaphoreEntryData | null {
        const semaphore = this.map.get(key);
        if (semaphore === undefined) {
            return null;
        }
        MemorySemaphoreAdapter.removeExpiredSlots(semaphore);
        return semaphore;
    }

    /**
     * Removes all in-memory shared-lock data.
     */
    removeAllExpired(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;
        const existingEntry = this.map.get(key);
        if (existingEntry === undefined) {
            this.map.set(key, {
                limit,
                slots: new Map([
                    [slotId, { expiration: ttl?.toEndDate() ?? null }],
                ]),
            });
            return Promise.resolve(true);
        }

        this.removeExpiredSlots(existingEntry);

        if (existingEntry.slots.size === 0) {
            existingEntry.limit = limit;
        }

        if (existingEntry.slots.size >= existingEntry.limit) {
            return Promise.resolve(false);
        }

        if (existingEntry.slots.has(slotId)) {
            return Promise.resolve(true);
        }

        existingEntry.slots.set(slotId, {
            expiration: ttl?.toEndDate() ?? null,
        });
        return Promise.resolve(true);
    }

    release(
        key: string,
        slotId: string,
        _context: IReadableContext,
    ): Promise<boolean> {
        const entry = this.map.get(key);
        if (entry === undefined) {
            return Promise.resolve(false);
        }
        this.removeExpiredSlots(entry);
        const slot = entry.slots.get(slotId);
        if (slot === undefined) {
            return Promise.resolve(false);
        }
        entry.slots.delete(slotId);
        return Promise.resolve(true);
    }

    forceReleaseAll(key: string, _context: IReadableContext): Promise<boolean> {
        const entry = this.map.get(key);
        if (entry === undefined) {
            return Promise.resolve(false);
        }
        const unexpiredSlots = [...entry.slots].filter(([, slot]) =>
            MemorySemaphoreAdapter.isSlotNotExpired(slot),
        );
        this.map.delete(key);
        return Promise.resolve(unexpiredSlots.length > 0);
    }

    refresh(
        key: string,
        slotId: string,
        ttl: TimeSpan,
        _context: IReadableContext,
    ): Promise<boolean> {
        const entry = this.map.get(key);
        if (entry === undefined) {
            return Promise.resolve(false);
        }
        const slot = entry.slots.get(slotId);
        if (slot === undefined) {
            return Promise.resolve(false);
        }
        if (slot.expiration === null) {
            return Promise.resolve(false);
        }
        if (slot.expiration <= new Date()) {
            return Promise.resolve(false);
        }
        slot.expiration = ttl.toEndDate();
        return Promise.resolve(true);
    }

    getState(
        key: string,
        _context: IReadableContext,
    ): Promise<ISemaphoreAdapterState | null> {
        const entry = this.map.get(key);
        if (entry === undefined) {
            return Promise.resolve(null);
        }
        const unexpiredSlots = new Map(
            [...entry.slots]
                .filter(([, slot]) =>
                    MemorySemaphoreAdapter.isSlotNotExpired(slot),
                )
                .map(([slotId, slot]) => [slotId, slot.expiration] as const),
        );
        if (unexpiredSlots.size === 0) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            limit: entry.limit,
            acquiredSlots: unexpiredSlots,
        });
    }
}
