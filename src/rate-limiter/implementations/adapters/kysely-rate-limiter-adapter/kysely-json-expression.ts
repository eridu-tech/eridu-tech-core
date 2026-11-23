/**
 * @module RateLimiter
 */

import { sql } from "kysely";

import type { RawBuilder } from "kysely";

type JsonPath = ReadonlyArray<string>;

function toPostgresPath(path: JsonPath): string {
    return `{${path.join(",")}}`;
}

function toSqlitePath(path: JsonPath): string {
    return `$.${path.map((segment) => `"${segment}"`).join(".")}`;
}

/**
 * Reads a JSON property as text on both sqlite and postgres.
 *
 * @internal
 */
export function resolveJsonTextExpression(
    column: string,
    path: JsonPath,
    isPostgres: boolean,
): RawBuilder<string | null> {
    if (isPostgres) {
        return sql<
            string | null
        >`${sql.ref(column)} #>> ${sql.lit(toPostgresPath(path))}`;
    }
    return sql<
        string | null
    >`json_extract(${sql.ref(column)}, ${sql.lit(toSqlitePath(path))})`;
}

/**
 * Reads a JSON property as a number on both sqlite and postgres.
 *
 * @internal
 */
export function resolveJsonNumberExpression(
    column: string,
    path: JsonPath,
    isPostgres: boolean,
): RawBuilder<number | null> {
    if (isPostgres) {
        return sql<
            number | null
        >`(${sql.ref(column)} #>> ${sql.lit(toPostgresPath(path))})::numeric`;
    }
    return sql<
        number | null
    >`json_extract(${sql.ref(column)}, ${sql.lit(toSqlitePath(path))})`;
}

/**
 * Builds a JSON object on both sqlite and postgres.
 *
 * @internal
 */
export function resolveJsonObjectExpression(
    entries: ReadonlyArray<readonly [string, RawBuilder<unknown>]>,
    isPostgres: boolean,
): RawBuilder<string> {
    const args = entries.flatMap(([key, value]) => [sql.lit(key), value]);
    if (isPostgres) {
        return sql<string>`jsonb_build_object(${sql.join(args, sql`, `)})`;
    }
    return sql<string>`json_object(${sql.join(args, sql`, `)})`;
}

/**
 * Inlines a number as a SQL literal. Numbers are computed by the adapter itself
 * (never user input), and inlining keeps `bigint`/`numeric` promotion identical
 * on sqlite and postgres.
 *
 * @internal
 */
export function resolveNumberLiteral(value: number): RawBuilder<number> {
    if (!Number.isFinite(value)) {
        throw new TypeError("'value' must be a finite number");
    }
    return sql.raw<number>(String(value));
}

/**
 * Truncates toward zero, which equals `floor` for the non-negative counters used
 * by the rate limiter, so sqlite does not depend on `SQLITE_ENABLE_MATH_FUNCTIONS`.
 *
 * @internal
 */
export function resolveIntegerExpression(
    value: RawBuilder<number>,
    isPostgres: boolean,
): RawBuilder<number> {
    if (isPostgres) {
        return sql<number>`floor(${value})::bigint`;
    }
    return sql<number>`cast(${value} as integer)`;
}
