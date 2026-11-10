import { describe, expect, test } from "vitest";

import {
    resolveOneOrMore,
    resolveOneOrMoreStr,
} from "@/utilities/functions/resolve-one-or-more.js";

describe("file: resolve-one-or-more.ts", () => {
    describe("function: resolveOneOrMore", () => {
        test("Should wrap a single value in an array", () => {
            expect(resolveOneOrMore(1)).toStrictEqual([1]);
        });
        test("Should wrap a single string in an array instead of splitting it", () => {
            expect(resolveOneOrMore("abc")).toStrictEqual(["abc"]);
        });
        test("Should copy an array", () => {
            const values = [1, 2, 3];

            const result = resolveOneOrMore(values);

            expect(result).toStrictEqual([1, 2, 3]);
            expect(result).not.toBe(values);
        });
        test("Should spread a set", () => {
            expect(resolveOneOrMore(new Set([1, 2]))).toStrictEqual([1, 2]);
        });
        test("Should spread a generator", () => {
            function* values(): Generator<number> {
                yield 1;
                yield 2;
            }

            expect(resolveOneOrMore(values())).toStrictEqual([1, 2]);
        });
        test("Should keep an object as a single item", () => {
            const value = { id: 1 };

            expect(resolveOneOrMore(value)).toStrictEqual([value]);
        });
        test("Should keep undefined as a single item", () => {
            expect(resolveOneOrMore(undefined)).toStrictEqual([undefined]);
        });
    });

    describe("function: resolveOneOrMoreStr", () => {
        test("Should return a single string untouched", () => {
            expect(resolveOneOrMoreStr("abc")).toBe("abc");
        });
        test("Should join the values with a slash by default", () => {
            expect(resolveOneOrMoreStr(["a", "b", "c"])).toBe("a/b/c");
        });
        test("Should join the values with a custom separator", () => {
            expect(resolveOneOrMoreStr(["a", "b"], "-")).toBe("a-b");
        });
        test("Should drop the empty strings before joining", () => {
            expect(resolveOneOrMoreStr(["a", "", "b", ""])).toBe("a/b");
        });
        test("Should return an empty string when there are no values", () => {
            expect(resolveOneOrMoreStr([])).toBe("");
        });
        test("Should join a set of values", () => {
            expect(resolveOneOrMoreStr(new Set(["a", "b"]))).toBe("a/b");
        });
    });
});
