/**
 * @module Utilities
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * @internal
 */
export function isStandardSchema<TInput, TOutput>(
    value: unknown,
): value is StandardSchemaV1<TInput, TOutput> {
    return (
        typeof value === "object" &&
        value !== null &&
        "~standard" in value &&
        typeof value["~standard"] === "object" &&
        value["~standard"] !== null
    );
}
