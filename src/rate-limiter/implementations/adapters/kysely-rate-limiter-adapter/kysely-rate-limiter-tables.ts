/**
 * @module RateLimiter
 */

import type { RateLimiterStateEnum } from "@/rate-limiter/contracts/_module-exports.js";

/**
 * Stored rate limiter row.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterEntryTable = {
    /**
     * Unique identifier for the rate limiter entry.
     */
    key: string;

    /**
     * JSON serialized `RateLimiterStateEnum`.
     *
     * Some sql drivers (e.g. postgres) return json columns parsed while others
     * (e.g. sqlite) return them as strings.
     */
    data: RateLimiterStateEnum | string;

    /**
     * Unix timestamp in ms after which the row can be pruned.
     */
    expiration: number | bigint | string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterTables = {
    rateLimiter: KyselyRateLimiterEntryTable;
};

/**
 * @internal
 */
export function parseRateLimiterData(
    data: RateLimiterStateEnum | string,
): RateLimiterStateEnum {
    if (typeof data === "string") {
        return JSON.parse(data) as RateLimiterStateEnum;
    }
    return data;
}

/**
 * @internal
 */
export function toRateLimiterExpiration(
    expiration: number | bigint | string | null,
): Date | null {
    if (expiration === null) {
        return null;
    }
    return new Date(Number(expiration));
}
