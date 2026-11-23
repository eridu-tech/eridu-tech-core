/**
 * @module CircuitBreaker
 */

import type { IDeinitizable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class SimpleCircuitBreakerStorage<TType> implements IDeinitizable {
    constructor(private readonly map = new Map<string, TType>()) {}

    deInit(): void {
        this.map.clear();
    }

    upsert(key: string, state: TType): void {
        this.map.set(key, state);
    }

    find(key: string): TType | null {
        return this.map.get(key) ?? null;
    }

    remove(key: string): void {
        this.map.delete(key);
    }
}
