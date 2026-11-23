/**
 * @module CircuitBreaker
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
 * Reads a JSON array, falling back to an empty array when the property is missing.
 *
 * @internal
 */
export function resolveJsonArrayExpression(
    column: string,
    path: JsonPath,
    isPostgres: boolean,
): RawBuilder<string> {
    if (isPostgres) {
        return sql<string>`coalesce(${sql.ref(column)} #> ${sql.lit(
            toPostgresPath(path),
        )}, '[]'::jsonb)`;
    }
    return sql<string>`coalesce(json_extract(${sql.ref(
        column,
    )}, ${sql.lit(toSqlitePath(path))}), '[]')`;
}

/**
 * Appends a JSON value to the end of a JSON array.
 *
 * @internal
 */
export function resolveArrayAppendExpression(
    array: RawBuilder<unknown>,
    value: RawBuilder<unknown>,
    isPostgres: boolean,
): RawBuilder<string> {
    if (isPostgres) {
        return sql<string>`(${array} || jsonb_build_array(${value}))`;
    }
    return sql<string>`json_insert(${array}, '$[#]', json(${value}))`;
}

/**
 * @internal
 */
export function resolveArrayLengthExpression(
    array: RawBuilder<unknown>,
    isPostgres: boolean,
): RawBuilder<number> {
    if (isPostgres) {
        return sql<number>`jsonb_array_length(${array})`;
    }
    return sql<number>`json_array_length(${array})`;
}

/**
 * Drops the first element of a JSON array.
 *
 * @internal
 */
export function resolveArrayTailExpression(
    array: RawBuilder<unknown>,
    isPostgres: boolean,
): RawBuilder<string> {
    if (isPostgres) {
        return sql<string>`(select coalesce(jsonb_agg(entry.value order by entry.ord), '[]'::jsonb) from jsonb_array_elements(${array}) with ordinality as entry(value, ord) where entry.ord > 1)`;
    }
    return sql<string>`coalesce((select json_group_array(entry.value) from json_each(${array}) as entry where entry.key > 0), '[]')`;
}

/**
 * Counts the boolean `false` entries of a JSON array.
 *
 * @internal
 */
export function resolveArrayFalseCountExpression(
    array: RawBuilder<unknown>,
    isPostgres: boolean,
): RawBuilder<number> {
    if (isPostgres) {
        return sql<number>`(select count(*) from jsonb_array_elements_text(${array}) as entry where entry.value = 'false')`;
    }
    return sql<number>`(select count(*) from json_each(${array}) as entry where entry.value = 0)`;
}

/**
 * Counts the boolean `true` entries of a JSON array.
 *
 * @internal
 */
export function resolveArrayTrueCountExpression(
    array: RawBuilder<unknown>,
    isPostgres: boolean,
): RawBuilder<number> {
    if (isPostgres) {
        return sql<number>`(select count(*) from jsonb_array_elements_text(${array}) as entry where entry.value = 'true')`;
    }
    return sql<number>`(select count(*) from json_each(${array}) as entry where entry.value = 1)`;
}

/**
 * Rounds a non negative number up. sqlite is expressed with a truncating cast so the
 * adapter does not depend on `SQLITE_ENABLE_MATH_FUNCTIONS`.
 *
 * @internal
 */
export function resolveCeilExpression(
    value: RawBuilder<number>,
    isPostgres: boolean,
): RawBuilder<number> {
    if (isPostgres) {
        return sql<number>`ceil(${value})`;
    }
    return sql<number>`(cast(${value} as integer) + (case when ${value} > cast(${value} as integer) then 1 else 0 end))`;
}

/**
 * Keeps only the samples that still overlap the sampling window.
 *
 * @internal
 */
export function resolveSamplesFilterExpression(
    samples: RawBuilder<unknown>,
    settings: { windowStart: number; sampleTimeSpan: number },
    isPostgres: boolean,
): RawBuilder<string> {
    const { windowStart, sampleTimeSpan } = settings;
    if (isPostgres) {
        return sql<string>`(select coalesce(jsonb_agg(entry.value order by entry.ord), '[]'::jsonb) from jsonb_array_elements(${samples}) with ordinality as entry(value, ord) where (entry.value->>'startedAt')::numeric + ${sampleTimeSpan} >= ${windowStart})`;
    }
    return sql<string>`coalesce((select json_group_array(entry.value) from json_each(${samples}) as entry where json_extract(entry.value, '$.startedAt') + ${sampleTimeSpan} >= ${windowStart}), '[]')`;
}

/**
 * Reads the `startedAt` of the last sample, or `null` when there is none.
 *
 * @internal
 */
export function resolveLastSampleStartedAtExpression(
    samples: RawBuilder<unknown>,
    isPostgres: boolean,
): RawBuilder<number | null> {
    if (isPostgres) {
        return sql<
            number | null
        >`((${samples} -> -1) ->> 'startedAt')::numeric`;
    }
    return sql<number | null>`json_extract(${samples}, '$[#-1].startedAt')`;
}

/**
 * Increments the given counter of the last sample, keeping every other sample as is.
 *
 * @internal
 */
export function resolveIncrementLastSampleExpression(
    samples: RawBuilder<unknown>,
    field: "failures" | "successes",
    isPostgres: boolean,
): RawBuilder<string> {
    if (isPostgres) {
        return sql<string>`(select coalesce(jsonb_agg(case when entry.ord = jsonb_array_length(${samples}) then jsonb_set(entry.value, ${sql.lit(
            `{${field}}`,
        )}, to_jsonb(coalesce((entry.value->>${sql.lit(field)})::numeric, 0) + 1)) else entry.value end order by entry.ord), '[]'::jsonb) from jsonb_array_elements(${samples}) with ordinality as entry(value, ord))`;
    }
    return sql<string>`coalesce((select json_group_array(case when entry.key = json_array_length(${samples}) - 1 then json_set(entry.value, ${sql.lit(
        `$.${field}`,
    )}, json_extract(entry.value, ${sql.lit(
        `$.${field}`,
    )}) + 1) else entry.value end) from json_each(${samples}) as entry), '[]')`;
}

/**
 * Sums a counter over all samples.
 *
 * @internal
 */
export function resolveSamplesSumExpression(
    samples: RawBuilder<unknown>,
    field: "failures" | "successes",
    isPostgres: boolean,
): RawBuilder<number> {
    if (isPostgres) {
        return sql<number>`(select coalesce(sum((entry.value->>${sql.lit(
            field,
        )})::numeric), 0) from jsonb_array_elements(${samples}) as entry(value))`;
    }
    return sql<number>`coalesce((select sum(json_extract(entry.value, ${sql.lit(
        `$.${field}`,
    )})) from json_each(${samples}) as entry), 0)`;
}
