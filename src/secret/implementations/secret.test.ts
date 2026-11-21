import { describe, expect, test } from "vitest";

import { secret } from "@/secret/implementations/_module-exports.js";

describe(
    "function: secret",
    { tags: ["Memory", "Implementations", "Secret"] },
    () => {
        describe("method: toString", () => {
            test("Should always return the redacted placeholder", () => {
                expect(secret("super-secret").toString()).toBe("[redacted]");
                expect(secret({ password: "super-secret" }).toString()).toBe(
                    "[redacted]",
                );
            });

            test("Should redact the value when converted to a string", () => {
                expect(String(secret("super-secret"))).toBe("[redacted]");
            });
        });

        describe("method: get", () => {
            test("Should return the wrapped primitive value", () => {
                expect(secret("super-secret").get()).toBe("super-secret");
                expect(secret(42).get()).toBe(42);
            });

            test("Should return the same object reference", () => {
                const value = { password: "super-secret" };

                expect(secret(value).get()).toBe(value);
            });
        });
    },
);
