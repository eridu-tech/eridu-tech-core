/**
 * @module RateLimiter
 */

import { sql } from "kysely";

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";

import type { RawBuilder } from "kysely";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";

/**
 * SQL counterpart of `resolveBackoffDelayExpression` for MongoDB: the delay is
 * evaluated server side so a whole `updateState` transition fits in one statement.
 *
 * `randomValue` is the jitter sample, sampled once per statement so the stored
 * state and its expiration agree.
 *
 * @internal
 */
export function resolveBackoffDelayExpression(
    settings: Required<SerializedBackoffSettingsEnum>,
    attempt: RawBuilder<number>,
    randomValue: number,
    isPostgres: boolean,
): RawBuilder<number> {
    const delay = resolveBaseDelayExpression(settings, attempt, isPostgres);
    const { jitter } = settings;
    if (jitter === null) {
        return delay;
    }
    return sql<number>`(1 - ${jitter} * ${randomValue}) * ${delay}`;
}

function resolveBaseDelayExpression(
    settings: Required<SerializedBackoffSettingsEnum>,
    attempt: RawBuilder<number>,
    isPostgres: boolean,
): RawBuilder<number> {
    if (settings.type === BACKOFFS.CONSTANT) {
        return sql<number>`${settings.delay}`;
    }
    if (settings.type === BACKOFFS.EXPONENTIAL) {
        return resolveLeastExpression(
            settings.maxDelay,
            sql<number>`${settings.minDelay} * ${resolvePowerExpression(
                settings.multiplier,
                attempt,
                isPostgres,
            )}`,
            isPostgres,
        );
    }
    if (settings.type === BACKOFFS.LINEAR) {
        return resolveLeastExpression(
            settings.maxDelay,
            sql<number>`${settings.minDelay} * ${attempt}`,
            isPostgres,
        );
    }
    return resolveLeastExpression(
        settings.maxDelay,
        sql<number>`${settings.minDelay} * ${resolvePowerExpression(
            attempt,
            settings.degree,
            isPostgres,
        )}`,
        isPostgres,
    );
}

function resolveLeastExpression(
    maxDelay: number,
    delay: RawBuilder<number>,
    isPostgres: boolean,
): RawBuilder<number> {
    if (isPostgres) {
        return sql<number>`least(${maxDelay}, ${delay})`;
    }
    return sql<number>`min(${maxDelay}, ${delay})`;
}

function resolvePowerExpression(
    base: number | RawBuilder<number>,
    exponent: number | RawBuilder<number>,
    isPostgres: boolean,
): RawBuilder<number> {
    if (isPostgres) {
        return sql<number>`power(${base}, ${exponent})`;
    }
    return sql<number>`pow(${base}, ${exponent})`;
}
