import { describe, expect, test } from "vitest";

import { isClass } from "@/utilities/functions/is-class.js";

describe("function: isClass", () => {
    test("Should return true when a class declaration", () => {
        class Example {
            readonly value = 1;
        }

        expect(isClass(Example)).toBe(true);
    });
    test("Should return true when a class expression", () => {
        const exampleClass = class {
            readonly value = 1;
        };

        expect(isClass(exampleClass)).toBe(true);
    });
    test("Should return true when an anonymous class", () => {
        expect(
            isClass(
                class {
                    readonly value = 1;
                },
            ),
        ).toBe(true);
    });
    test("Should return true when a class with members", () => {
        class Example {
            value = 1;
            method(): number {
                return this.value;
            }
        }

        expect(isClass(Example)).toBe(true);
    });
    test("Should return false when a function declaration", () => {
        function example(): void {}

        expect(isClass(example)).toBeFalsy();
    });
    test("Should return false when an arrow function", () => {
        expect(isClass(() => {})).toBeFalsy();
    });
    test("Should return false when a class instance", () => {
        class Example {
            readonly value = 1;
        }

        expect(isClass(new Example())).toBeFalsy();
    });
    test("Should return false when a plain object", () => {
        expect(isClass({})).toBeFalsy();
    });
    test("Should return false when null", () => {
        expect(isClass(null)).toBeFalsy();
    });
    test("Should return false when undefined", () => {
        expect(isClass(undefined)).toBeFalsy();
    });
    test("Should return false when a string", () => {
        expect(isClass("class")).toBeFalsy();
    });
    test("Should return false when a number", () => {
        expect(isClass(1)).toBeFalsy();
    });
    test("Should return false when a native constructor function", () => {
        expect(isClass(Object)).toBeFalsy();
    });
});
