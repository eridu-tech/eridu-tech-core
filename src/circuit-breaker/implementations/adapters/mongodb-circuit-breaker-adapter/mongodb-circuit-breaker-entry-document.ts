/**
 * @module CircuitBreaker
 */

import type { ObjectId } from "mongodb";

import type { CircuitBreakerStateEnum } from "@/circuit-breaker/contracts/_module-exports.js";

/**
 * Stored circuit breaker document.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/mongodb-circuit-breaker-adapter"`
 * @group Adapters
 */
export type MongodbCircuitBreakerEntryDocument = {
    _id?: ObjectId;

    /**
     * Unique identifier of the circuit breaker instance.
     */
    key: string;

    /**
     * Serialized `CircuitBreakerStateEnum`.
     */
    data: CircuitBreakerStateEnum;

    /**
     * Internal bookkeeping: the state the stored entry had before the last
     * `updateState` call, so a single database call can report the transition.
     */
    lastTransitionFrom?: CircuitBreakerStateEnum["state"]["type"];
};
