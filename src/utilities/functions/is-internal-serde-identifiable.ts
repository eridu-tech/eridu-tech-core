/**
 * @module Utilities
 */

/**
 * @internal
 */
export type InternalSerdeIdentifiable = {
    internalClassTag(): symbol;
    internalSerializationId(): string;
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
