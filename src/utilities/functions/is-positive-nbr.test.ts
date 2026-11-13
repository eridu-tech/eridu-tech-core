import { describe, expect, test } from "vitest";

import { isPositiveNbr } from "@/utilities/functions/is-positive-nbr.js";

describe("function: isPositiveNbr", () => {
    test("Should not throw when the number is 1", () => {
        expect(() => {
            isPositiveNbr(1);
        }).not.toThrow();
    });
    test("Should not throw when the number is larger than 1", () => {
        expect(() => {
            isPositiveNbr(2.5);
        }).not.toThrow();
    });
    test("Should not throw when the number is the largest finite value", () => {
        expect(() => {
            isPositiveNbr(Number.MAX_VALUE);
        }).not.toThrow();
    });
    test("Should throw when the number is 0", () => {
        expect(() => {
            isPositiveNbr(0);
        }).toThrow(new TypeError("Number must be larger than 0"));
    });
    test("Should throw when the number is between 0 and 1", () => {
        expect(() => {
            isPositiveNbr(0.5);
        }).toThrow(new TypeError("Number must be larger than 0"));
    });
    test("Should throw when the number is negative", () => {
        expect(() => {
            isPositiveNbr(-1);
        }).toThrow(new TypeError("Number must be larger than 0"));
    });
    test("Should throw when the number is negative infinity", () => {
        expect(() => {
            isPositiveNbr(-Infinity);
        }).toThrow(new TypeError("Number must be larger than 0"));
    });
    test("Should throw when the number is NaN", () => {
        expect(() => {
            isPositiveNbr(Number.NaN);
        }).toThrow(new TypeError("Number cannot be NaN"));
    });
    test("Should throw when the number is positive infinity", () => {
        expect(() => {
            isPositiveNbr(Infinity);
        }).toThrow(new TypeError("Number cannot be infinite"));
    });
    test("Should use the field name in the message", () => {
        expect(() => {
            isPositiveNbr(0, "limit");
        }).toThrow(new TypeError("limit must be larger than 0"));
    });
    test("Should use the field name in the NaN message", () => {
        expect(() => {
            isPositiveNbr(Number.NaN, "limit");
        }).toThrow(new TypeError("limit cannot be NaN"));
    });
});
