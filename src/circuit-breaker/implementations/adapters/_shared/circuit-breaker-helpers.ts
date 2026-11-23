/**
 * @module CircuitBreaker
 */

import { BREAKER_POLICIES } from "@/circuit-breaker/contracts/_module-exports.js";
import { resolveConsecutiveBreakerSettings } from "@/circuit-breaker/implementations/adapters/_shared/consecutive-breaker-helpers.js";
import { resolveCountBreakerSettings } from "@/circuit-breaker/implementations/adapters/_shared/count-breaker-helpers.js";
import {
    resolveSamplingBreakerSettings,
    serializeSamplingBreakerSettings,
} from "@/circuit-breaker/implementations/adapters/_shared/sampling-breaker-helpers.js";

import type {
    CircuitBreakerPolicySettingsEnum,
    ConsecutiveBreakerSettingsEnum,
    CountBreakerSettingsEnum,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { SerializedSamplingBreakerSettings } from "@/circuit-breaker/implementations/adapters/_shared/sampling-breaker-helpers.js";

/**
 * @internal
 */
export type SerializedSamplingBreakerSettingsEnum =
    SerializedSamplingBreakerSettings & {
        type: (typeof BREAKER_POLICIES)["SAMPLING"];
    };

/**
 * @internal
 */
export type SerializedCircuitBreakerPolicySettingsEnum =
    | ConsecutiveBreakerSettingsEnum
    | CountBreakerSettingsEnum
    | SerializedSamplingBreakerSettingsEnum;

/**
 * @internal
 */
export function resolveCircuitBreakerPolicySettings(
    settings: CircuitBreakerPolicySettingsEnum,
): Required<CircuitBreakerPolicySettingsEnum> {
    if (settings.type === BREAKER_POLICIES.CONSECUTIVE) {
        return {
            type: BREAKER_POLICIES.CONSECUTIVE,
            ...resolveConsecutiveBreakerSettings(settings),
        };
    }
    if (settings.type === BREAKER_POLICIES.SAMPLING) {
        return {
            type: BREAKER_POLICIES.SAMPLING,
            ...resolveSamplingBreakerSettings(settings),
        };
    }
    return {
        type: BREAKER_POLICIES.COUNT,
        ...resolveCountBreakerSettings(settings),
    };
}

/**
 * @internal
 */
export function serializeCircuitBreakerPolicySettingsEnum(
    settings: CircuitBreakerPolicySettingsEnum,
): Required<SerializedCircuitBreakerPolicySettingsEnum> {
    if (settings.type === BREAKER_POLICIES.CONSECUTIVE) {
        return {
            type: BREAKER_POLICIES.CONSECUTIVE,
            ...resolveConsecutiveBreakerSettings(settings),
        };
    }
    if (settings.type === BREAKER_POLICIES.SAMPLING) {
        return {
            type: BREAKER_POLICIES.SAMPLING,
            ...serializeSamplingBreakerSettings(settings),
        };
    }
    return {
        type: BREAKER_POLICIES.COUNT,
        ...resolveCountBreakerSettings(settings),
    };
}
