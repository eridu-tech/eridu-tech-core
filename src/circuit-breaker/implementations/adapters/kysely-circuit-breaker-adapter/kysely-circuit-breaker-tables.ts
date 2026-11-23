/**
 * @module CircuitBreaker
 */

import type { CircuitBreakerStateEnum } from "@/circuit-breaker/contracts/_module-exports.js";

/**
 * Stored circuit breaker row.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerEntryTable = {
    /**
     * Unique identifier for the circuit breaker entry.
     */
    key: string;

    /**
     * JSON serialized `CircuitBreakerStateEnum`.
     *
     * Some sql drivers (e.g. postgres) return json columns parsed while others
     * (e.g. sqlite) return them as strings.
     */
    data: CircuitBreakerStateEnum | string;

    /**
     * The state the row had before the last `updateState` call, so a single
     * statement can report both sides of the transition.
     */
    lastTransitionFrom: string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerTables = {
    circuitBreaker: KyselyCircuitBreakerEntryTable;
};

/**
 * @internal
 */
export function parseCircuitBreakerData(
    data: CircuitBreakerStateEnum | string,
): CircuitBreakerStateEnum {
    if (typeof data === "string") {
        return JSON.parse(data) as CircuitBreakerStateEnum;
    }
    return data;
}
