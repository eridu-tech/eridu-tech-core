/**
 * @module CircuitBreaker
 */

import { SimpleCircuitBreakerStorage } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/simple-circuit-breaker-storage.js";

import type {
    CircuitBreakerStateTransition,
    AllCircuitBreakerState,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { InternalCircuitBreakerPolicy } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/internal-circuit-breaker-policy.js";
import type { CircuitBreakerUpdateStateFn } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/types.js";
import type { IDeinitizable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class CircuitBreakerStorage<
    TMetrics = unknown,
> implements IDeinitizable {
    private readonly simpleStorage = new SimpleCircuitBreakerStorage<
        AllCircuitBreakerState<TMetrics>
    >();

    constructor(
        private readonly circuitBreakerPolicy: InternalCircuitBreakerPolicy<TMetrics>,
    ) {}

    deInit(): void {
        this.simpleStorage.deInit();
    }

    update(
        key: string,
        update: CircuitBreakerUpdateStateFn<TMetrics>,
    ): CircuitBreakerStateTransition {
        const currentDate = new Date();
        const currentState =
            this.simpleStorage.find(key) ??
            this.circuitBreakerPolicy.initialState();

        const newState = update(currentState, currentDate);

        if (!this.circuitBreakerPolicy.isEqual(currentState, newState)) {
            this.simpleStorage.upsert(key, newState);
        }

        return {
            from: currentState.type,
            to: newState.type,
        };
    }

    find(key: string): AllCircuitBreakerState<TMetrics> {
        return (
            this.simpleStorage.find(key) ??
            this.circuitBreakerPolicy.initialState()
        );
    }

    remove(key: string): void {
        this.simpleStorage.remove(key);
    }
}
