import { describe, expect, test } from "vitest";

import {
    OPTION,
    optionNone,
    optionSome,
} from "@/utilities/functions/option.js";

describe("file: option.ts", () => {
    describe("constant: OPTION", () => {
        test("Should expose the some type", () => {
            expect(OPTION.SOME).toBe("some");
        });
        test("Should expose the none type", () => {
            expect(OPTION.NONE).toBe("none");
        });
    });
    describe("function: optionSome", () => {
        test("Should wrap the value in a some option", () => {
            const option = optionSome("value");

            expect(option).toStrictEqual({
                type: OPTION.SOME,
                value: "value",
            });
        });
        test("Should keep falsy values", () => {
            expect(optionSome(0)).toStrictEqual({
                type: OPTION.SOME,
                value: 0,
            });
            expect(optionSome("")).toStrictEqual({
                type: OPTION.SOME,
                value: "",
            });
            expect(optionSome(null)).toStrictEqual({
                type: OPTION.SOME,
                value: null,
            });
        });
        test("Should keep object values by reference", () => {
            const value = { id: 1 };

            expect(optionSome(value).value).toBe(value);
        });
    });
    describe("function: optionNone", () => {
        test("Should create a none option without a value", () => {
            expect(optionNone()).toStrictEqual({ type: OPTION.NONE });
        });
        test("Should not expose a value property", () => {
            expect(optionNone()).not.toHaveProperty("value");
        });
    });
});
