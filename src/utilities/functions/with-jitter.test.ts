import { describe, expect, test } from "vitest";

import { withJitter } from "@/utilities/functions/with-jitter.js";

describe("function: withJitter", () => {
    test("Should return the value unchanged when jitter is null", () => {
        const result = withJitter({
            jitter: null,
            value: 100,
            randomValue: 0.5,
        });

        expect(result).toBe(100);
    });
    test("Should scale the value by the jitter and the random value", () => {
        const result = withJitter({
            jitter: 0.2,
            value: 100,
            randomValue: 0.5,
        });

        expect(result).toBeCloseTo(90);
    });
    test("Should return the value unchanged when jitter is 0", () => {
        const result = withJitter({ jitter: 0, value: 100, randomValue: 0.5 });

        expect(result).toBe(100);
    });
    test("Should scale the value down by the full jitter when the random value is 1", () => {
        const result = withJitter({ jitter: 0.5, value: 10, randomValue: 1 });

        expect(result).toBeCloseTo(5);
    });
    test("Should return an untouched copy of the value when the random value is 0", () => {
        const result = withJitter({ jitter: 0.9, value: 42, randomValue: 0 });

        expect(result).toBe(42);
    });
    test("Should keep a zero value at zero", () => {
        const result = withJitter({ jitter: 0.5, value: 0, randomValue: 1 });

        expect(result).toBe(0);
    });
    test("Should keep fractional values proportional", () => {
        const result = withJitter({
            jitter: 0.25,
            value: 4,
            randomValue: 1,
        });

        expect(result).toBeCloseTo(3);
    });
});
