/**
 * @module CircuitBreaker
 */

import {
    BACKOFFS,
    constantBackoff,
    exponentialBackoff,
    linearBackoff,
    polynomialBackoff,
    resolveBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import { BREAKER_POLICIES } from "@/circuit-breaker/contracts/_module-exports.js";
import { CircuitBreakerStateManager } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/circuit-breaker-state-manager.js";
import { CircuitBreakerStorage } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/circuit-breaker-storage.js";
import { InternalCircuitBreakerPolicy } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/internal-circuit-breaker-policy.js";
import { ConsecutiveBreaker } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/policies/consecutive-breaker/_module.js";
import { CountBreaker } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/policies/count-breaker/_module.js";
import { SamplingBreaker } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/policies/sampling-breaker/_module.js";

import type { BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import type { BackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    CircuitBreakerPolicySettingsEnum,
    CircuitBreakerState,
    CircuitBreakerStateTransition,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { ICircuitBreakerPolicy } from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import type { IDeinitizable } from "@/utilities/_module-exports.js";

/**
 * Configuration for `MemoryCircuitBreakerAdapter`.
 * The adapter owns its in-memory storage, so the settings only choose the policies it applies.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/memory-circuit-breaker-adapter"`
 * @group Adapters
 */
export type MemoryCircuitBreakerAdapterSettings = {
    /**
     * You can choose between different types of predefined backoff policies.
     * @default
     * ```ts
     * { type: BACKOFFS.EXPONENTIAL }
     * ```
     */
    backoffPolicy?: BackoffSettingsEnum;

    /**
     * You can choose between different types of predefined circuit breaker policies.
     * @default
     * ```ts
     * { type: BREAKER_POLICIES.CONSECUTIVE, failureThreshold: 5 }
     * ```
     */
    circuitBreakerPolicy?: CircuitBreakerPolicySettingsEnum;
};

/**
 * In-memory `ICircuitBreakerAdapter` that stores every key's state in the current process.
 * State is not shared between processes and is lost when the process restarts.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/memory-circuit-breaker-adapter"`
 * @group Adapters
 */
export class MemoryCircuitBreakerAdapter<TMetrics = unknown>
    implements ICircuitBreakerAdapter, IDeinitizable
{
    private readonly circuitBreakerStorage: CircuitBreakerStorage<TMetrics>;
    private readonly circuitBreakerStateManager: CircuitBreakerStateManager<TMetrics>;

    private static selectBackoff(
        backoffPolicy: BackoffSettingsEnum,
    ): BackoffPolicy {
        if (backoffPolicy.type === BACKOFFS.CONSTANT) {
            return constantBackoff(backoffPolicy);
        }
        if (backoffPolicy.type === BACKOFFS.LINEAR) {
            return linearBackoff(backoffPolicy);
        }
        if (backoffPolicy.type === BACKOFFS.EXPONENTIAL) {
            return exponentialBackoff(backoffPolicy);
        }
        return polynomialBackoff(backoffPolicy);
    }

    private static selectBreaker(
        circuitBreakerPolicy: CircuitBreakerPolicySettingsEnum,
    ): ICircuitBreakerPolicy<any> {
        if (circuitBreakerPolicy.type === BREAKER_POLICIES.CONSECUTIVE) {
            return new ConsecutiveBreaker(circuitBreakerPolicy);
        }
        if (circuitBreakerPolicy.type === BREAKER_POLICIES.SAMPLING) {
            return new SamplingBreaker(circuitBreakerPolicy);
        }
        return new CountBreaker(circuitBreakerPolicy);
    }

    constructor(settings: MemoryCircuitBreakerAdapterSettings = {}) {
        const {
            backoffPolicy = {
                type: BACKOFFS.EXPONENTIAL,
            },
            circuitBreakerPolicy = {
                type: BREAKER_POLICIES.CONSECUTIVE,
                failureThreshold: 5,
            },
        } = settings;

        const backoff = MemoryCircuitBreakerAdapter.selectBackoff(
            resolveBackoffSettingsEnum(backoffPolicy),
        );
        const breaker =
            MemoryCircuitBreakerAdapter.selectBreaker(circuitBreakerPolicy);

        const internalCircuitBreakerPolicy = new InternalCircuitBreakerPolicy(
            breaker as ICircuitBreakerPolicy<TMetrics>,
        );

        this.circuitBreakerStorage = new CircuitBreakerStorage(
            internalCircuitBreakerPolicy,
        );
        this.circuitBreakerStateManager = new CircuitBreakerStateManager(
            internalCircuitBreakerPolicy,
            backoff,
        );
    }

    deInit(): void {
        this.circuitBreakerStorage.deInit();
    }

    getState(key: string): Promise<CircuitBreakerState> {
        return Promise.resolve(this.circuitBreakerStorage.find(key).type);
    }

    updateState(key: string): Promise<CircuitBreakerStateTransition> {
        return Promise.resolve(
            this.circuitBreakerStorage.update(
                key,
                this.circuitBreakerStateManager.updateState,
            ),
        );
    }

    trackFailure(key: string): Promise<void> {
        this.circuitBreakerStorage.update(
            key,
            this.circuitBreakerStateManager.trackFailure,
        );
        return Promise.resolve();
    }

    trackSuccess(key: string): Promise<void> {
        this.circuitBreakerStorage.update(
            key,
            this.circuitBreakerStateManager.trackSuccess,
        );
        return Promise.resolve();
    }

    reset(key: string): Promise<void> {
        this.circuitBreakerStorage.remove(key);
        return Promise.resolve();
    }

    isolate(key: string): Promise<void> {
        this.circuitBreakerStorage.update(
            key,
            this.circuitBreakerStateManager.isolate,
        );
        return Promise.resolve();
    }
}
