import { describe, expect, test } from "vitest";

import {
    BlockedRateLimiterError,
    isRateLimiterError,
    isUnableToRateLimiterError,
    UnableToGetStateRateLimiterError,
    UnableToResetRateLimiterError,
    UnableToUpdateStateRateLimiterError,
} from "@/rate-limiter/contracts/rate-limiter.errors.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

describe("file: rate-limiter.errors.ts", () => {
    describe("function: isRateLimiterError", () => {
        test("Should return true when given BlockedRateLimiterError instance", () => {
            const error = BlockedRateLimiterError.create(
                {
                    limit: 5,
                    totalAttempts: 7,
                    exceedAttempts: 2,
                    retryAfter: TimeSpan.fromSeconds(1),
                },
                "a",
            );
            expect(isRateLimiterError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStateRateLimiterError instance", () => {
            const error = UnableToGetStateRateLimiterError.create("a");
            expect(isRateLimiterError(error)).toBe(true);
        });
        test("Should return true when given UnableToUpdateStateRateLimiterError instance", () => {
            const error = UnableToUpdateStateRateLimiterError.create("a");
            expect(isRateLimiterError(error)).toBe(true);
        });
        test("Should return true when given UnableToResetRateLimiterError instance", () => {
            const error = UnableToResetRateLimiterError.create("a");
            expect(isRateLimiterError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isRateLimiterError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isRateLimiterError("")).toBe(false);
            expect(isRateLimiterError(null)).toBe(false);
        });
    });
    describe("function: isUnableToRateLimiterError", () => {
        test("Should return true when given UnableToGetStateRateLimiterError instance", () => {
            const error = UnableToGetStateRateLimiterError.create("a");
            expect(isUnableToRateLimiterError(error)).toBe(true);
        });
        test("Should return true when given UnableToUpdateStateRateLimiterError instance", () => {
            const error = UnableToUpdateStateRateLimiterError.create("a");
            expect(isUnableToRateLimiterError(error)).toBe(true);
        });
        test("Should return true when given UnableToResetRateLimiterError instance", () => {
            const error = UnableToResetRateLimiterError.create("a");
            expect(isUnableToRateLimiterError(error)).toBe(true);
        });
        test("Should return false when given a BlockedRateLimiterError instance", () => {
            const error = BlockedRateLimiterError.create(
                {
                    limit: 5,
                    totalAttempts: 7,
                    exceedAttempts: 2,
                    retryAfter: TimeSpan.fromSeconds(1),
                },
                "a",
            );
            expect(isUnableToRateLimiterError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isUnableToRateLimiterError(new Error("generic"))).toBe(
                false,
            );
        });
        test("Should return false when given a non-error value", () => {
            expect(isUnableToRateLimiterError("")).toBe(false);
            expect(isUnableToRateLimiterError(null)).toBe(false);
        });
    });
});
