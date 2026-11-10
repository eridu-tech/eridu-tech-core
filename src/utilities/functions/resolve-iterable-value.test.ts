import { describe, expect, test } from "vitest";

import { resolveIterableValue } from "@/utilities/functions/resolve-iterable-value.js";

describe("function: resolveIterableValue", () => {
    test("Should return an array as is", () => {
        const values = [1, 2, 3];

        expect(resolveIterableValue(values)).toBe(values);
    });
    test("Should return a set as is", () => {
        const values = new Set([1, 2]);

        expect(resolveIterableValue(values)).toBe(values);
    });
    test("Should return a string as is", () => {
        expect([...resolveIterableValue("ab")]).toStrictEqual(["a", "b"]);
    });
    test("Should convert an array like value to an iterable", () => {
        const values: ArrayLike<number> = { 0: 1, 1: 2, length: 2 };

        expect([...resolveIterableValue(values)]).toStrictEqual([1, 2]);
    });
    test("Should skip undefined items in an array like value", () => {
        const values: ArrayLike<number | undefined> = {
            0: 1,
            1: undefined,
            2: 3,
            length: 3,
        };

        expect([...resolveIterableValue(values)]).toStrictEqual([1, 3]);
    });
    test("Should respect the length of an array like value", () => {
        const values: ArrayLike<number> = { 0: 1, 1: 2, 2: 3, length: 2 };

        expect([...resolveIterableValue(values)]).toStrictEqual([1, 2]);
    });
    test("Should return an empty iterable when the array like value is empty", () => {
        const values: ArrayLike<number> = { length: 0 };

        expect([...resolveIterableValue(values)]).toStrictEqual([]);
    });
    test("Should not consume the iterable source", () => {
        const values = [1, 2];

        const iterable = resolveIterableValue(values);

        expect([...iterable]).toStrictEqual([1, 2]);
        expect([...iterable]).toStrictEqual([1, 2]);
    });
});
