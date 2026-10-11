/**
 * @module CircuitBreaker
 */

import {
    CIRCUIT_BREAKER_CLASS_TAG,
    CircuitBreaker,
} from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import { isInternalSerdeIdentifiable } from "@/utilities/_module-exports.js";

import type {
    CircuitBreakerTrigger,
    ICircuitBreaker,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { ISerializedCircuitBreaker } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module-exports.js";
import type { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import type {
    ErrorPolicy,
    OneOrMore,
    WaitUntil,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type CircuitBreakerSerdeTransformerSettings = {
    adapter: ICircuitBreakerAdapter;
    slowCallTime: TimeSpan;
    errorPolicy: ErrorPolicy;
    trigger: CircuitBreakerTrigger;
    serializationId: string;
    enableAsyncTracking: boolean;
    waitUntil: WaitUntil;
};

/**
 * @internal
 */
export class CircuitBreakerSerdeTransformer implements ISerdeTransformer<
    ICircuitBreaker,
    ISerializedCircuitBreaker
> {
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly slowCallTime: TimeSpan;
    private readonly errorPolicy: ErrorPolicy;
    private readonly trigger: CircuitBreakerTrigger;
    private readonly serializationId: string;
    private readonly enableAsyncTracking: boolean;
    private readonly waitUntil: WaitUntil;

    constructor(settings: CircuitBreakerSerdeTransformerSettings) {
        const {
            adapter,
            slowCallTime,
            errorPolicy,
            trigger,
            serializationId,
            enableAsyncTracking,
            waitUntil,
        } = settings;

        this.waitUntil = waitUntil;
        this.enableAsyncTracking = enableAsyncTracking;
        this.adapter = adapter;
        this.slowCallTime = slowCallTime;
        this.errorPolicy = errorPolicy;
        this.trigger = trigger;
        this.serializationId = serializationId;
    }

    get name(): OneOrMore<string> {
        return ["circuitBreaker", this.serializationId].filter(
            (str) => str !== "",
        );
    }

    async isApplicable(value: unknown): Promise<boolean> {
        if (!isInternalSerdeIdentifiable(value)) {
            return false;
        }
        if (value.internalClassTag() !== CIRCUIT_BREAKER_CLASS_TAG) {
            return false;
        }

        const isSerlizationIdMathcing =
            this.serializationId === (await value.internalSerializationId());

        return isSerlizationIdMathcing;
    }

    deserialize(serializedValue: ISerializedCircuitBreaker): CircuitBreaker {
        const { key } = serializedValue;

        return new CircuitBreaker({
            waitUntil: this.waitUntil,
            enableAsyncTracking: this.enableAsyncTracking,
            adapter: this.adapter,
            key,
            slowCallTime: this.slowCallTime,
            errorPolicy: this.errorPolicy,
            trigger: this.trigger,
            serializationId: this.serializationId,
        });
    }

    serialize(deserializedValue: CircuitBreaker): ISerializedCircuitBreaker {
        return CircuitBreaker.internalSerialize(deserializedValue);
    }
}
