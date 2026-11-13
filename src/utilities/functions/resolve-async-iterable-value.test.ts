import { describe, expect, test } from "vitest";

import { resolveAsyncIterableValue } from "@/utilities/functions/resolve-async-iterable-value.js";

async function toArray<TItem>(
    iterable: AsyncIterable<TItem>,
): Promise<Array<TItem>> {
    const items: Array<TItem> = [];
    for await (const item of iterable) {
        items.push(item);
    }
    return items;
}

describe("function: resolveAsyncIterableValue", () => {
    test("Should return an async iterable as is", () => {
        const values: AsyncIterable<number> = {
            async *[Symbol.asyncIterator](): AsyncIterator<number> {
                yield await Promise.resolve(1);
                yield await Promise.resolve(2);
            },
        };

        expect(resolveAsyncIterableValue(values)).toBe(values);
    });
    test("Should convert an iterable to an async iterable", async () => {
        const result = await toArray(
            resolveAsyncIterableValue(new Set([1, 2])),
        );

        expect(result).toStrictEqual([1, 2]);
    });
    test("Should convert an array to an async iterable", async () => {
        const result = await toArray(resolveAsyncIterableValue([1, 2, 3]));

        expect(result).toStrictEqual([1, 2, 3]);
    });
    test("Should convert an array like value to an async iterable", async () => {
        const values: ArrayLike<string> = { 0: "a", 1: "b", length: 2 };

        const result = await toArray(resolveAsyncIterableValue(values));

        expect(result).toStrictEqual(["a", "b"]);
    });
    test("Should skip undefined items in an array like value", async () => {
        const values: ArrayLike<number | undefined> = {
            0: 1,
            1: undefined,
            2: 3,
            length: 3,
        };

        const result = await toArray(resolveAsyncIterableValue(values));

        expect(result).toStrictEqual([1, 3]);
    });
    test("Should return an empty async iterable when the array like value is empty", async () => {
        const values: ArrayLike<number> = { length: 0 };

        const result = await toArray(resolveAsyncIterableValue(values));

        expect(result).toStrictEqual([]);
    });
    test("Should resolve the yielded values in order", async () => {
        const values: AsyncIterable<string> = {
            async *[Symbol.asyncIterator](): AsyncIterator<string> {
                yield await Promise.resolve("a");
                yield await Promise.resolve("b");
            },
        };

        const result = await toArray(resolveAsyncIterableValue(values));

        expect(result).toStrictEqual(["a", "b"]);
    });
});
