/**
 * @module RateLimiter
 */

import {
    resolveFixedWindowLimiterSettings,
    serializeFixedWindowLimiterSettings,
} from "@/rate-limiter/implementations/adapters/_shared/fixed-window-limiter-helpers.js";
import {
    resolveSlidingWindowLimiterSettings,
    serializeSlidingWindowLimiterSettings,
} from "@/rate-limiter/implementations/adapters/_shared/sliding-window-limiter-helpers.js";

import type {
    FixedWindowLimiterSettings,
    SerializedFixedWindowLimiterSettings,
} from "@/rate-limiter/implementations/adapters/_shared/fixed-window-limiter-helpers.js";
import type {
    SerializedSlidingWindowLimiterSettings,
    SlidingWindowLimiterSettings,
} from "@/rate-limiter/implementations/adapters/_shared/sliding-window-limiter-helpers.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/policies"`
 * @group Policies
 */
export const LIMITER_POLICIES = {
    FIXED_WINDOW: "FIXED_WINDOW",
    SLIDING_WINDOW: "SLIDING_WINDOW",
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/policies"`
 * @group Policies
 */
export type FixedWindowLimiterSettingsEnum = FixedWindowLimiterSettings & {
    /**
     * Discriminant identifying this as the fixed-window rate-limiter policy.
     */
    type: (typeof LIMITER_POLICIES)["FIXED_WINDOW"];
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/policies"`
 * @group Policies
 */
export type SlidingWindowLimiterSettingsEnum = SlidingWindowLimiterSettings & {
    /**
     * Discriminant identifying this as the sliding-window rate-limiter policy.
     */
    type: (typeof LIMITER_POLICIES)["SLIDING_WINDOW"];
};

/**
 * @internal
 */
export type RateLimiterPolicySettingsEnum =
    FixedWindowLimiterSettingsEnum | SlidingWindowLimiterSettingsEnum;

/**
 * @internal
 */
export type SerializedFixedWindowLimiterSettingsEnum =
    SerializedFixedWindowLimiterSettings & {
        type: (typeof LIMITER_POLICIES)["FIXED_WINDOW"];
    };

/**
 * @internal
 */
export type SerializedSlidingWindowLimiterSettingsEnum =
    SerializedSlidingWindowLimiterSettings & {
        type: (typeof LIMITER_POLICIES)["SLIDING_WINDOW"];
    };

/**
 * @internal
 */
export type SerializedRateLimiterPolicySettingsEnum =
    | SerializedFixedWindowLimiterSettingsEnum
    | SerializedSlidingWindowLimiterSettingsEnum;

/**
 * @internal
 */
export function resolveRateLimiterPolicySettings(
    settings: RateLimiterPolicySettingsEnum,
): Required<RateLimiterPolicySettingsEnum> {
    if (settings.type === LIMITER_POLICIES.FIXED_WINDOW) {
        return {
            type: LIMITER_POLICIES.FIXED_WINDOW,
            ...resolveFixedWindowLimiterSettings(settings),
        };
    }
    return {
        type: LIMITER_POLICIES.SLIDING_WINDOW,
        ...resolveSlidingWindowLimiterSettings(settings),
    };
}

/**
 * @internal
 */
export function serializeRateLimiterPolicySettingsEnum(
    settings: RateLimiterPolicySettingsEnum,
): Required<SerializedRateLimiterPolicySettingsEnum> {
    if (settings.type === LIMITER_POLICIES.FIXED_WINDOW) {
        return {
            type: LIMITER_POLICIES.FIXED_WINDOW,
            ...serializeFixedWindowLimiterSettings(settings),
        };
    }
    return {
        type: LIMITER_POLICIES.SLIDING_WINDOW,
        ...serializeSlidingWindowLimiterSettings(settings),
    };
}
