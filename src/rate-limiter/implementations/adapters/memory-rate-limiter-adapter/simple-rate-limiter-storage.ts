/**
 * @module RateLimiter
 */

import type { IDeinitizable, IPrunable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type MemoryRateLimiterData<TType = unknown> = {
    state: TType;
    expiration: Date;
};

/**
 * @internal
 */
export class SimpleRateLimiterStorage<TType>
    implements IDeinitizable, IPrunable
{
    constructor(
        private readonly map = new Map<string, MemoryRateLimiterData<TType>>(),
    ) {}

    removeAllExpired(): void {
        for (const [key, entry] of this.map) {
            if (entry.expiration > new Date()) {
                continue;
            }
            this.map.delete(key);
        }
    }

    deInit(): void {
        this.map.clear();
    }

    upsert(key: string, state: TType, expiration: Date): void {
        this.map.set(key, {
            state,
            expiration,
        });
    }

    find(key: string): MemoryRateLimiterData<TType> | null {
        const data = this.map.get(key);
        if (data === undefined) {
            return null;
        }
        return {
            state: data.state,
            expiration: data.expiration,
        };
    }

    remove(key: string): void {
        const data = this.map.get(key);
        if (data === undefined) {
            return;
        }
        this.map.delete(key);
    }
}
