import { describe, expect, test } from "vitest";
import { z } from "zod";

import {
    ValidationError,
    validate,
    validateSync,
} from "@/utilities/functions/validate.js";

import type { StandardSchemaV1 } from "@standard-schema/spec";

function createSyncSchema<TValue>(
    result: StandardSchemaV1.Result<TValue>,
): StandardSchemaV1<unknown, TValue> {
    return {
        "~standard": {
            version: 1,
            vendor: "test",
            validate: () => result,
        },
    };
}

function createAsyncSchema<TValue>(
    result: StandardSchemaV1.Result<TValue>,
): StandardSchemaV1<unknown, TValue> {
    return {
        "~standard": {
            version: 1,
            vendor: "test",
            validate: () => Promise.resolve(result),
        },
    };
}

describe("class: ValidationError", () => {
    test("Should expose the issues", () => {
        const issues: ReadonlyArray<StandardSchemaV1.Issue> = [
            { message: "invalid" },
        ];

        const error = ValidationError.create(issues);

        expect(error.issues).toStrictEqual(issues);
    });
    test("Should use a fixed message", () => {
        expect(ValidationError.create([]).message).toBe(
            "A validation error occurred:",
        );
    });
    test("Should set the error name", () => {
        expect(ValidationError.create([]).name).toBe("ValidationError");
    });
    test("Should keep the cause", () => {
        const cause = new Error("cause");

        const error = new ValidationError("failed", [], cause);

        expect(error.cause).toBe(cause);
    });
});

describe("file: validate.ts", () => {
    describe("function: validate", () => {
        test("Should return the validated value of a schema", async () => {
            const schema = z.object({ name: z.string() });

            const result = await validate(schema, { name: "Jane" });

            expect(result).toStrictEqual({ name: "Jane" });
        });
        test("Should return the transformed value of a schema", async () => {
            const schema = z.string().transform((value) => value.length);

            const result = await validate(schema, "abcd");

            expect(result).toBe(4);
        });
        test("Should return the value of a synchronous standard schema", async () => {
            const schema = createSyncSchema({ value: 42 });

            const result = await validate(schema, "input");

            expect(result).toBe(42);
        });
        test("Should return the value of an asynchronous standard schema", async () => {
            const schema = createAsyncSchema({ value: "async" });

            const result = await validate(schema, "input");

            expect(result).toBe("async");
        });
        test("Should throw a ValidationError when the schema issues", async () => {
            const schema = z.object({ name: z.string() });
            const invalidInput = { name: 1 } as unknown as { name: string };

            const promise = validate(schema, invalidInput);

            await expect(promise).rejects.toThrow(ValidationError);
        });
        test("Should expose the issues on the thrown ValidationError", async () => {
            const schema = z.object({ name: z.string() });
            const invalidInput = { name: 1 } as unknown as { name: string };

            const error = await validate(schema, invalidInput).catch(
                (caught: unknown) => caught,
            );

            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).issues.length).toBeGreaterThan(0);
        });
        test("Should throw a ValidationError when a custom schema issues", async () => {
            const schema = createSyncSchema({
                issues: [{ message: "custom" }],
            });

            await expect(validate(schema, "input")).rejects.toThrow(
                new ValidationError("A validation error occurred:", [
                    { message: "custom" },
                ]),
            );
        });
    });

    describe("function: validateSync", () => {
        test("Should return the validated value of a schema", () => {
            const schema = z.object({ name: z.string() });

            const result = validateSync(schema, { name: "Jane" });

            expect(result).toStrictEqual({ name: "Jane" });
        });
        test("Should return the value of a synchronous standard schema", () => {
            const schema = createSyncSchema({ value: 42 });

            const result = validateSync(schema, "input");

            expect(result).toBe(42);
        });
        test("Should throw a ValidationError when the schema issues", () => {
            const schema = z.object({ name: z.string() });
            const invalidInput = { name: 1 } as unknown as { name: string };

            expect(() => {
                validateSync(schema, invalidInput);
            }).toThrow(ValidationError);
        });
        test("Should expose the issues on the thrown ValidationError", () => {
            const schema = createSyncSchema({
                issues: [{ message: "custom" }],
            });
            let error: unknown;
            try {
                validateSync(schema, "input");
            } catch (caught: unknown) {
                error = caught;
            }

            expect(error).toBeInstanceOf(ValidationError);
            expect((error as ValidationError).issues).toStrictEqual([
                { message: "custom" },
            ]);
        });
        test("Should throw a TypeError when the schema is async", () => {
            const schema = createAsyncSchema({ value: 42 });

            expect(() => {
                validateSync(schema, "input");
            }).toThrow(
                new TypeError(
                    "validateSync() does not support async schemas. Use validate() instead.",
                ),
            );
        });
    });
});
