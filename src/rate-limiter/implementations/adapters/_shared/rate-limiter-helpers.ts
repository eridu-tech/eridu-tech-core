/**
 * @module RateLimiter
 */

import { LIMITER_POLICIES } from "@/rate-limiter/contracts/rate-limiter-policy.contract.js";
import {
    resolveFixedWindowLimiterSettings,
    serializeFixedWindowLimiterSettings,
} from "@/rate-limiter/implementations/adapters/_shared/fixed-window-limiter-helpers.js";
import {
    resolveSlidingWindowLimiterSettings,
    serializeSlidingWindowLimiterSettings,
} from "@/rate-limiter/implementations/adapters/_shared/sliding-window-limiter-helpers.js";

import type { RateLimiterPolicySettingsEnum } from "@/rate-limiter/contracts/rate-limiter-policy.contract.js";
import type { SerializedFixedWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/fixed-window-limiter-helpers.js";
import type { SerializedSlidingWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/sliding-window-limiter-helpers.js";

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
