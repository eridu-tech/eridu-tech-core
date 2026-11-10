import { describe, expect, test } from "vitest";

import { isNullable } from "@/utilities/functions/is-nullable.js";

describe("function: isNullable", () => {
    test("Should return true when null", () => {
        expect(isNullable(null)).toBe(true);
    });
    test("Should return true when undefined", () => {
        expect(isNullable(undefined)).toBe(true);
    });
    test("Should return false when 0", () => {
        expect(isNullable(0)).toBe(false);
    });
    test("Should return false when an empty string", () => {
        expect(isNullable("")).toBe(false);
    });
    test("Should return false when false", () => {
        expect(isNullable(false)).toBe(false);
    });
    test("Should return false when NaN", () => {
        expect(isNullable(Number.NaN)).toBe(false);
    });
    test("Should return false when an object", () => {
        expect(isNullable({})).toBe(false);
    });
    test("Should return false when a function", () => {
        expect(isNullable(() => {})).toBe(false);
    });
});
