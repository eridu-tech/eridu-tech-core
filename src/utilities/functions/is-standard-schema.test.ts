import { describe, expect, test } from "vitest";
import { z } from "zod";

import { isStandardSchema } from "@/utilities/functions/is-standard-schema.js";

import type { StandardSchemaV1 } from "@standard-schema/spec";

describe("function: isStandardSchema", () => {
    test("Should return true when a zod schema", () => {
        expect(isStandardSchema(z.string())).toBe(true);
    });
    test("Should return true when an object with the standard properties", () => {
        const schema: StandardSchemaV1<string, string> = {
            "~standard": {
                version: 1,
                vendor: "test",
                validate: () => ({ value: "value" }),
            },
        };

        expect(isStandardSchema(schema)).toBe(true);
    });
    test("Should return false when a plain object", () => {
        expect(isStandardSchema({})).toBe(false);
    });
    test("Should return false when the standard property is null", () => {
        expect(isStandardSchema({ "~standard": null })).toBe(false);
    });
    test("Should return false when the standard property is not an object", () => {
        expect(isStandardSchema({ "~standard": "1" })).toBe(false);
    });
    test("Should return false when null", () => {
        expect(isStandardSchema(null)).toBe(false);
    });
    test("Should return false when undefined", () => {
        expect(isStandardSchema(undefined)).toBe(false);
    });
    test("Should return false when a string", () => {
        expect(isStandardSchema("~standard")).toBe(false);
    });
    test("Should return false when a number", () => {
        expect(isStandardSchema(1)).toBe(false);
    });
    test("Should return false when a boolean", () => {
        expect(isStandardSchema(true)).toBe(false);
    });
    test("Should return false when a function", () => {
        expect(isStandardSchema(() => {})).toBe(false);
    });
});
