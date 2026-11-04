import { describe, expect, test } from "vitest";

import {
    FailedRefreshSemaphoreError,
    FailedReleaseSemaphoreError,
    isSemaphoreError,
    isUnableToSemaphoreError,
    LimitReachedSemaphoreError,
    UnableToAcquireSemaphoreError,
    UnableToForceReleaseAllSemaphoreError,
    UnableToGetStateSemaphoreError,
    UnableToRefreshSemaphoreError,
    UnableToReleaseSemaphoreError,
} from "@/semaphore/contracts/semaphore.errors.js";

describe("file: semaphore.errors.ts", () => {
    describe("function: isSemaphoreError", () => {
        test("Should return true when given LimitReachedSemaphoreError instance", () => {
            const error = LimitReachedSemaphoreError.create("a");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given FailedRefreshSemaphoreError instance", () => {
            const error = FailedRefreshSemaphoreError.create("a", "slot-1");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given FailedReleaseSemaphoreError instance", () => {
            const error = FailedReleaseSemaphoreError.create("a", "slot-1");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToAcquireSemaphoreError instance", () => {
            const error = UnableToAcquireSemaphoreError.create("a");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToReleaseSemaphoreError instance", () => {
            const error = UnableToReleaseSemaphoreError.create("a", "slot-1");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToForceReleaseAllSemaphoreError instance", () => {
            const error = UnableToForceReleaseAllSemaphoreError.create("a");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToRefreshSemaphoreError instance", () => {
            const error = UnableToRefreshSemaphoreError.create("a", "slot-1");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStateSemaphoreError instance", () => {
            const error = UnableToGetStateSemaphoreError.create("a");
            expect(isSemaphoreError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isSemaphoreError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isSemaphoreError("")).toBe(false);
            expect(isSemaphoreError(null)).toBe(false);
        });
    });
    describe("function: isUnableToSemaphoreError", () => {
        test("Should return true when given UnableToAcquireSemaphoreError instance", () => {
            const error = UnableToAcquireSemaphoreError.create("a");
            expect(isUnableToSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToReleaseSemaphoreError instance", () => {
            const error = UnableToReleaseSemaphoreError.create("a", "slot-1");
            expect(isUnableToSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToForceReleaseAllSemaphoreError instance", () => {
            const error = UnableToForceReleaseAllSemaphoreError.create("a");
            expect(isUnableToSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToRefreshSemaphoreError instance", () => {
            const error = UnableToRefreshSemaphoreError.create("a", "slot-1");
            expect(isUnableToSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStateSemaphoreError instance", () => {
            const error = UnableToGetStateSemaphoreError.create("a");
            expect(isUnableToSemaphoreError(error)).toBe(true);
        });
        test("Should return false when given a LimitReachedSemaphoreError instance", () => {
            const error = LimitReachedSemaphoreError.create("a");
            expect(isUnableToSemaphoreError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isUnableToSemaphoreError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isUnableToSemaphoreError("")).toBe(false);
            expect(isUnableToSemaphoreError(null)).toBe(false);
        });
    });
});
