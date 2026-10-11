/**
 * @module Utilities
 */

import type { Promisable } from "@/utilities/types/_module.js";

/**
 * @internal
 */
export type InternalSerdeIdentifiable = {
    internalClassTag(): symbol;
    internalSerializationId(): Promisable<string>;
};

/**
 * @internal
 */
export function isInternalSerdeIdentifiable(
    value: unknown,
): value is InternalSerdeIdentifiable {
    return (
        typeof value === "object" &&
        value !== null &&
        "internalClassTag" in value &&
        typeof value.internalClassTag === "function" &&
        "internalSerializationId" in value &&
        typeof value.internalSerializationId === "function"
    );
}
