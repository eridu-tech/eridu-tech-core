import { describe, expect, test } from "vitest";

import {
    SecretSerdeTransformer,
    secret,
} from "@/secret/implementations/_module-exports.js";

describe(
    "class: SecretSerdeTransformer",
    { tags: ["Memory", "Implementations"] },
    () => {
        describe("method: isApplicable", () => {
            test("Should return true for secrets created by secret()", () => {
                const transformer = new SecretSerdeTransformer<string>();

                expect(transformer.isApplicable(secret("super-secret"))).toBe(
                    true,
                );
            });

            test("Should return true for any structurally secret object", () => {
                const transformer = new SecretSerdeTransformer<number>();

                expect(
                    transformer.isApplicable({
                        toString: () => "[redacted]",
                        get: () => 1,
                    }),
                ).toBe(true);
            });

            test("Should return false for non-secret values", () => {
                const transformer = new SecretSerdeTransformer();

                expect(transformer.isApplicable(null)).toBe(false);
                expect(transformer.isApplicable(undefined)).toBe(false);
                expect(transformer.isApplicable("super-secret")).toBe(false);
                expect(transformer.isApplicable({})).toBe(false);
                expect(transformer.isApplicable({ toString: () => "" })).toBe(
                    false,
                );
            });
        });

        describe("method: serialize", () => {
            test("Should unwrap the secret value", () => {
                const transformer = new SecretSerdeTransformer<string>();

                expect(
                    transformer.serialize(secret("super-secret")),
                ).toStrictEqual({
                    version: "1",
                    value: "super-secret",
                });
            });
        });

        describe("method: deserialize", () => {
            test("Should wrap the serialized value back into a secret", () => {
                const transformer = new SecretSerdeTransformer<string>();

                const result = transformer.deserialize({
                    version: "1",
                    value: "super-secret",
                });

                expect(result.get()).toBe("super-secret");
                expect(result.toString()).toBe("[redacted]");
            });
        });
    },
);
