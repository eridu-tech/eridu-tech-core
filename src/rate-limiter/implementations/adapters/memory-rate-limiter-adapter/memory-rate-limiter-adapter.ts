/**
 * @module RateLimiter
 */

import {
    BACKOFFS,
    constantBackoff,
    exponentialBackoff,
    linearBackoff,
    polynomialBackoff,
    resolveBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/contracts/_module-exports.js";
import { InternalRateLimiterPolicy } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/internal-rate-limiter-policy.js";
import { FixedWindowLimiter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/policies/fixed-window-limiter/fixed-window-limiter.js";
import { SlidingWindowLimiter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/policies/sliding-window-limiter/sliding-window-limiter.js";
import { RateLimiterStateManager } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/rate-limiter-state-manager.js";
import { RateLimiterStorage } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/rate-limiter-storage.js";

import type { BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import type { BackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
    RateLimiterPolicySettingsEnum,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { IRateLimiterPolicy } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/rate-limiter-policy.contract.js";
import type { IDeinitizable, IPrunable } from "@/utilities/_module-exports.js";

/**
 * Configuration for `MemoryRateLimiterAdapter`.
 * The adapter owns its in-memory storage, so the settings only choose the policies it applies.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/memory-rate-limiter-adapter"`
 * @group Adapters
 */
export type MemoryRateLimiterAdapterSettings = {
    /**
     * You can choose between different types of predefined backoff policies.
     * @default
     * ```ts
     * { type: BACKOFFS.EXPONENTIAL }
     * ```
     */
    backoffPolicy?: BackoffSettingsEnum;

    /**
     * You can choose between different types of predefined rate limiter policies.
     * @default
     * ```ts
     * { type: LIMITER_POLICIES.FIXED_WINDOW }
     * ```
     */
    rateLimiterPolicy?: RateLimiterPolicySettingsEnum;
};

/**
 * In-memory `IRateLimiterAdapter` that stores every key's state in the current process.
 * State is not shared between processes and is lost when the process restarts.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/memory-rate-limiter-adapter"`
 * @group Adapters
 */
export class MemoryRateLimiterAdapter
    implements IRateLimiterAdapter, IDeinitizable, IPrunable
{
    private readonly rateLimiterStorage: RateLimiterStorage<any>;
    private readonly rateLimiterStateManager: RateLimiterStateManager<any>;

    private static selectBackoff(
        backoffPolicy: BackoffSettingsEnum,
    ): BackoffPolicy {
        if (backoffPolicy.type === "CONSTANT") {
            return constantBackoff(backoffPolicy);
        } else if (backoffPolicy.type === "LINEAR") {
            return linearBackoff(backoffPolicy);
        } else if (backoffPolicy.type === "EXPONENTIAL") {
            return exponentialBackoff(backoffPolicy);
        }
        return polynomialBackoff(backoffPolicy);
    }

    private static selectLimiter(
        rateLimiterPolicy: RateLimiterPolicySettingsEnum,
    ): IRateLimiterPolicy<any> {
        if (rateLimiterPolicy.type === LIMITER_POLICIES.FIXED_WINDOW) {
            return new FixedWindowLimiter(rateLimiterPolicy);
        }
        return new SlidingWindowLimiter(rateLimiterPolicy);
    }

    constructor(settings: MemoryRateLimiterAdapterSettings = {}) {
        const {
            backoffPolicy = {
                type: BACKOFFS.EXPONENTIAL,
            },
            rateLimiterPolicy = {
                type: LIMITER_POLICIES.FIXED_WINDOW,
            },
        } = settings;

        const backoff = MemoryRateLimiterAdapter.selectBackoff(
            resolveBackoffSettingsEnum(backoffPolicy),
        );
        const limiter =
            MemoryRateLimiterAdapter.selectLimiter(rateLimiterPolicy);

        const internalRateLimiterPolicy = new InternalRateLimiterPolicy(
            limiter,
        );

        this.rateLimiterStorage = new RateLimiterStorage({
            rateLimiterPolicy: internalRateLimiterPolicy,
            backoffPolicy: backoff,
        });
        this.rateLimiterStateManager = new RateLimiterStateManager(
            internalRateLimiterPolicy,
            backoff,
        );
    }

    removeAllExpired(): void {
        this.rateLimiterStorage.removeAllExpired();
    }

    deInit(): void {
        this.rateLimiterStorage.deInit();
    }

    getState(key: string): Promise<IRateLimiterAdapterState | null> {
        const state = this.rateLimiterStorage.find(key);
        if (state === null) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            success: state.success,
            attempt: state.attempt,
            resetTime: state.resetTime,
        });
    }

    updateState(key: string, limit: number): Promise<IRateLimiterAdapterState> {
        const currentDate = new Date();
        const track = this.rateLimiterStateManager.track(currentDate);
        const updateState = this.rateLimiterStateManager.updateState(
            limit,
            currentDate,
        );
        const state = this.rateLimiterStorage.update({
            key,
            update: (prevState) => {
                const newState1 = track(prevState);
                const newState2 = updateState(newState1);
                return newState2;
            },
        });
        return Promise.resolve({
            success: state.success,
            attempt: state.attempt,
            resetTime: state.resetTime,
        });
    }

    reset(key: string): Promise<void> {
        this.rateLimiterStorage.remove(key);
        return Promise.resolve();
    }
}
