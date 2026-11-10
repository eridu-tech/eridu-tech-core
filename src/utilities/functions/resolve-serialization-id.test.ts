import { describe, expect, test } from "vitest";

import { resolveSerializationId } from "@/utilities/functions/resolve-serialization-id.js";

describe("function: resolveSerializationId", () => {
    test("Should return the constructor name when no serialization id", () => {
        class Example {
            readonly value = 1;
        }

        expect(resolveSerializationId(undefined, new Example())).toBe(
            "Example",
        );
    });
    test("Should prefix the constructor name with the serialization id", () => {
        class Example {
            readonly value = 1;
        }

        expect(resolveSerializationId("custom:", new Example())).toBe(
            "custom:Example",
        );
    });
    test("Should use the Object constructor name for a plain object", () => {
        expect(resolveSerializationId(undefined, {})).toBe("Object");
    });
    test("Should use the Array constructor name for an array", () => {
        expect(resolveSerializationId("list:", [])).toBe("list:Array");
    });
    test("Should use the Date constructor name for a date", () => {
        expect(resolveSerializationId(undefined, new Date())).toBe("Date");
    });
    test("Should keep an empty serialization id", () => {
        class Example {
            readonly value = 1;
        }

        expect(resolveSerializationId("", new Example())).toBe("Example");
    });
    test("Should read the constructor from the prototype chain", () => {
        class Base {
            readonly base = 1;
        }
        class Derived extends Base {
            readonly derived = 2;
        }

        expect(resolveSerializationId(undefined, new Derived())).toBe(
            "Derived",
        );
    });
});
