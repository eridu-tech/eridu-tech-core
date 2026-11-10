import { describe, expect, test } from "vitest";

import { isInternalSerdeIdentifiable } from "@/utilities/functions/is-internal-serde-identifiable.js";

import type { InternalSerdeIdentifiable } from "@/utilities/functions/is-internal-serde-identifiable.js";

class Identifiable implements InternalSerdeIdentifiable {
    internalClassTag(): symbol {
        return Symbol.for("identifiable");
    }
    internalSerializationId(): string {
        return "Identifiable";
    }
}

describe("function: isInternalSerdeIdentifiable", () => {
    test("Should return true when an object with both methods", () => {
        const value: InternalSerdeIdentifiable = {
            internalClassTag: () => Symbol("tag"),
            internalSerializationId: () => "id",
        };

        expect(isInternalSerdeIdentifiable(value)).toBe(true);
    });
    test("Should return true when a class instance implementing both methods", () => {
        expect(isInternalSerdeIdentifiable(new Identifiable())).toBe(true);
    });
    test("Should return false when the class tag method is missing", () => {
        expect(
            isInternalSerdeIdentifiable({
                internalSerializationId: () => "id",
            }),
        ).toBe(false);
    });
    test("Should return false when the serialization id method is missing", () => {
        expect(
            isInternalSerdeIdentifiable({
                internalClassTag: () => Symbol("tag"),
            }),
        ).toBe(false);
    });
    test("Should return false when the members are not functions", () => {
        expect(
            isInternalSerdeIdentifiable({
                internalClassTag: Symbol("tag"),
                internalSerializationId: "id",
            }),
        ).toBe(false);
    });
    test("Should return false when null", () => {
        expect(isInternalSerdeIdentifiable(null)).toBe(false);
    });
    test("Should return false when undefined", () => {
        expect(isInternalSerdeIdentifiable(undefined)).toBe(false);
    });
    test("Should return false when a string", () => {
        expect(isInternalSerdeIdentifiable("identifiable")).toBe(false);
    });
    test("Should return false when a number", () => {
        expect(isInternalSerdeIdentifiable(1)).toBe(false);
    });
    test("Should return false when a plain object", () => {
        expect(isInternalSerdeIdentifiable({})).toBe(false);
    });
    test("Should return false when a function with both members", () => {
        const value = Object.assign(() => {}, {
            internalClassTag: () => Symbol("tag"),
            internalSerializationId: () => "id",
        });

        expect(isInternalSerdeIdentifiable(value)).toBe(false);
    });
});
