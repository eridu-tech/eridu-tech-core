/**
 * @module CircuitBreaker
 */

import {
    OpenCircuitBreakerError,
    IsolatedCircuitBreakerError,
    CIRCUIT_BREAKER_TRIGGER,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import {
    callErrorPolicyOnThrow,
    callInvocable,
    resolveAsyncLazyable,
} from "@/utilities/_module-exports.js";

import type {
    CircuitBreakerState,
    CircuitBreakerTrigger,
    ICircuitBreaker,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type {
    AsyncLazy,
    ErrorPolicy,
    InternalSerdeIdentifiable,
    InvocableFn,
    WaitUntil,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type CircuitBreakerSettings = {
    enableAsyncTracking: boolean;
    adapter: ICircuitBreakerAdapter;
    key: string;
    slowCallTime: TimeSpan;
    errorPolicy: ErrorPolicy;
    trigger: CircuitBreakerTrigger;
    serializationId: string;
    waitUntil: WaitUntil;
};

/**
 * @internal
 */
export type ISerializedCircuitBreaker = {
    version: "1";
    key: string;
};

/**
 * @internal
 */
export const CIRCUIT_BREAKER_CLASS_TAG = Symbol("CircuitBreaker");

/**
 * @internal
 */
export class CircuitBreaker
    implements ICircuitBreaker, InternalSerdeIdentifiable
{
    /**
     * @internal
     */
    static internalSerialize(
        deserializedValue: ICircuitBreaker,
    ): ISerializedCircuitBreaker {
        return {
            version: "1",
            key: deserializedValue.key,
        };
    }

    private readonly waitUntil: WaitUntil;
    private readonly internalKey: string;
    private readonly errorPolicy: ErrorPolicy;
    private readonly trigger: CircuitBreakerTrigger;
    private readonly slowCallTime: TimeSpan;
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly serializationId: string;
    private readonly enableAsyncTracking: boolean;

    constructor(settings: CircuitBreakerSettings) {
        const {
            enableAsyncTracking,
            key,
            errorPolicy,
            trigger,
            adapter,
            slowCallTime,
            serializationId,
            waitUntil,
        } = settings;

        this.waitUntil = waitUntil;
        this.enableAsyncTracking = enableAsyncTracking;
        this.internalKey = key;
        this.errorPolicy = errorPolicy;
        this.trigger = trigger;
        this.adapter = adapter;
        this.slowCallTime = slowCallTime;
        this.serializationId = serializationId;
    }

    internalClassTag(): symbol {
        return CIRCUIT_BREAKER_CLASS_TAG;
    }

    internalSerializationId(): string {
        return this.serializationId;
    }

    get key(): string {
        return this.internalKey;
    }

    async getState(): Promise<CircuitBreakerState> {
        return this.adapter.getState(this.internalKey);
    }

    private async trackFailure(): Promise<void> {
        if (this.enableAsyncTracking) {
            callInvocable(
                this.waitUntil,
                this.adapter.trackFailure(this.internalKey),
            );
            return;
        }
        await this.adapter.trackFailure(this.internalKey);
    }

    private async trackSuccess(): Promise<void> {
        if (this.enableAsyncTracking) {
            callInvocable(
                this.waitUntil,
                this.adapter.trackSuccess(this.internalKey),
            );
            return;
        }
        await this.adapter.trackSuccess(this.internalKey);
    }

    private async trackErrorWrapper<TValue = void>(
        fn: InvocableFn<[], Promise<TValue>>,
    ): Promise<TValue> {
        try {
            return await fn();
        } catch (error: unknown) {
            const isErrorMatching = await callErrorPolicyOnThrow(
                this.errorPolicy,
                error,
            );
            const shouldRecordError =
                this.trigger === CIRCUIT_BREAKER_TRIGGER.BOTH ||
                this.trigger === CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR;

            if (shouldRecordError && isErrorMatching) {
                if (this.enableAsyncTracking) {
                    callInvocable(this.waitUntil, this.trackFailure());
                } else {
                    await this.trackFailure();
                }
            }
            throw error;
        }
    }

    private async trackSlowCallWrapper<TValue = void>(
        fn: InvocableFn<[], Promise<TValue>>,
    ): Promise<TValue> {
        const start = performance.now();

        const value = await fn();

        const end = performance.now();

        const executionTime = TimeSpan.fromMilliseconds(end - start);

        const shouldRecordSlowCall =
            this.trigger === CIRCUIT_BREAKER_TRIGGER.BOTH ||
            this.trigger === CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL;
        const isCallSlow = executionTime.gte(this.slowCallTime);

        if (shouldRecordSlowCall && isCallSlow) {
            await this.trackFailure();
        }
        if (shouldRecordSlowCall && !isCallSlow) {
            await this.trackSuccess();
        }
        if (!shouldRecordSlowCall) {
            await this.trackSuccess();
        }

        return value;
    }

    private async guard(): Promise<void> {
        const transition = await this.adapter.updateState(this.internalKey);

        const isInOpenState = transition.to === CIRCUIT_BREAKER_STATE.OPEN;
        if (isInOpenState) {
            throw OpenCircuitBreakerError.create(this.internalKey);
        }
        const isIsolatedState =
            transition.to === CIRCUIT_BREAKER_STATE.ISOLATED;
        if (isIsolatedState) {
            throw IsolatedCircuitBreakerError.create(this.internalKey);
        }
    }

    async runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        await this.guard();

        return await this.trackErrorWrapper(async () => {
            return await this.trackSlowCallWrapper(async () => {
                return await resolveAsyncLazyable(asyncInvocable);
            });
        });
    }

    async reset(): Promise<void> {
        await this.adapter.reset(this.internalKey);
    }

    async isolate(): Promise<void> {
        await this.adapter.isolate(this.internalKey);
    }
}
