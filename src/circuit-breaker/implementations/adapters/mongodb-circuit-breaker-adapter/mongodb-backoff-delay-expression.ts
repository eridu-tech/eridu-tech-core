/**
 * @module CircuitBreaker
 */

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";

import type { Document } from "mongodb";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";

/**
 * Builds an aggregation-pipeline expression that evaluates the configured backoff
 * policy for `attemptExpression`, so the delay can be computed server-side.
 *
 * `randomValue` is the jitter sample used when the policy enables jitter.
 *
 * @internal
 */
export function resolveBackoffDelayExpression(
    settings: Required<SerializedBackoffSettingsEnum>,
    attemptExpression: string,
    randomValue: number,
): Document | number {
    const delay = resolveBaseDelayExpression(settings, attemptExpression);
    const { jitter } = settings;
    if (jitter === null) {
        return delay;
    }
    return {
        $multiply: [delay, 1 - jitter * randomValue],
    };
}

function resolveBaseDelayExpression(
    settings: Required<SerializedBackoffSettingsEnum>,
    attemptExpression: string,
): Document | number {
    if (settings.type === BACKOFFS.CONSTANT) {
        return settings.delay;
    }
    if (settings.type === BACKOFFS.EXPONENTIAL) {
        return {
            $min: [
                settings.maxDelay,
                {
                    $multiply: [
                        settings.minDelay,
                        { $pow: [settings.multiplier, attemptExpression] },
                    ],
                },
            ],
        };
    }
    if (settings.type === BACKOFFS.LINEAR) {
        return {
            $min: [
                settings.maxDelay,
                { $multiply: [settings.minDelay, attemptExpression] },
            ],
        };
    }
    return {
        $min: [
            settings.maxDelay,
            {
                $multiply: [
                    settings.minDelay,
                    { $pow: [attemptExpression, settings.degree] },
                ],
            },
        ],
    };
}
