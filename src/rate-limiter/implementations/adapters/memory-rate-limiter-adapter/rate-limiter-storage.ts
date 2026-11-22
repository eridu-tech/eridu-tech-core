/**
 * @module RateLimiter
 */

import { RATE_LIMITER_STATE } from "@/rate-limiter/contracts/_module-exports.js";
import { SimpleRateLimiterStorage } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/simple-rate-limiter-storage.js";

import type { BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import type {
    AllRateLimiterState,
    InternalRateLimiterPolicy,
} from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/internal-rate-limiter-policy.js";
import type { MemoryRateLimiterData } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/simple-rate-limiter-storage.js";
import type {
    IDeinitizable,
    InvocableFn,
    IPrunable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type RateLimiterStorageSettings<TMetrics> = {
    rateLimiterPolicy: InternalRateLimiterPolicy<TMetrics>;
    backoffPolicy: BackoffPolicy;
};

/**
 * @internal
 */
export type IRateLimiterStorageState = {
    success: boolean;
    attempt: number;
    resetTime: Date;
};

/**
 * @internal
 */
export type AtomicUpdateArgs<TMetrics> = {
    key: string;
    update: InvocableFn<
        [currentState: AllRateLimiterState<TMetrics>],
        AllRateLimiterState<TMetrics>
    >;
};

/**
 * @internal
 */
export class RateLimiterStorage<TMetrics = unknown>
    implements IDeinitizable, IPrunable
{
    private readonly adapter = new SimpleRateLimiterStorage<
        AllRateLimiterState<TMetrics>
    >();
    private readonly rateLimiterPolicy: InternalRateLimiterPolicy<TMetrics>;
    private readonly backoffPolicy: BackoffPolicy;

    constructor(settings: RateLimiterStorageSettings<TMetrics>) {
        const { rateLimiterPolicy, backoffPolicy } = settings;

        this.rateLimiterPolicy = rateLimiterPolicy;
        this.backoffPolicy = backoffPolicy;
    }

    removeAllExpired(): void {
        this.adapter.removeAllExpired();
    }

    deInit(): void {
        this.adapter.deInit();
    }

    private static resolveStorageData<TMetrics_>(
        data: MemoryRateLimiterData<AllRateLimiterState<TMetrics_>> | null,
    ): AllRateLimiterState<TMetrics_> | null {
        if (data === null) {
            return null;
        }
        if (data.expiration <= new Date()) {
            return null;
        }
        return data.state;
    }

    private toAdapterState(
        state: AllRateLimiterState<TMetrics>,
    ): IRateLimiterStorageState {
        const currentDate = new Date();
        return {
            success: state.type === RATE_LIMITER_STATE.ALLOWED,
            attempt: this.rateLimiterPolicy.getAttempts(state, currentDate),
            resetTime: this.rateLimiterPolicy.getExpiration(state, {
                backoffPolicy: this.backoffPolicy,
                currentDate,
            }),
        };
    }

    update(args: AtomicUpdateArgs<TMetrics>): IRateLimiterStorageState {
        const currentDate = new Date();
        let currentState = RateLimiterStorage.resolveStorageData(
            this.adapter.find(args.key),
        );
        if (currentState === null) {
            currentState = this.rateLimiterPolicy.initialState(currentDate);
        }

        const newState = args.update(currentState);

        this.adapter.upsert(
            args.key,
            newState,
            this.rateLimiterPolicy.getExpiration(newState, {
                backoffPolicy: this.backoffPolicy,
                currentDate,
            }),
        );

        return this.toAdapterState(newState);
    }

    find(key: string): IRateLimiterStorageState | null {
        const state = RateLimiterStorage.resolveStorageData(
            this.adapter.find(key),
        );
        if (state === null) {
            return null;
        }
        return this.toAdapterState(state);
    }

    remove(key: string): void {
        this.adapter.remove(key);
    }
}
