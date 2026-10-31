import { describe, expect, test } from "vitest";

import {
    FailedAcquireLockError,
    FailedRefreshLockError,
    FailedReleaseLockError,
    UnableToAcquireLockError,
    UnableToForceReleaseLockError,
    UnableToGetStateLockError,
    UnableToRefreshLockError,
    UnableToReleaseLockError,
    isLockError,
} from "@/lock/contracts/lock.errors.js";

describe("file: lock.errors.ts", () => {
    describe("function: isLockError", () => {
        test("Should return true when given FailedAcquireLockError instance", () => {
            const error = FailedAcquireLockError.create("a");
            expect(isLockError(error)).toBe(true);
        });
        test("Should return true when given FailedReleaseLockError instance", () => {
            const error = FailedReleaseLockError.create("a", "lock-1");
            expect(isLockError(error)).toBe(true);
        });
        test("Should return true when given FailedRefreshLockError instance", () => {
            const error = FailedRefreshLockError.create("a", "lock-1");
            expect(isLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToAcquireLockError instance", () => {
            const error = UnableToAcquireLockError.create("a");
            expect(isLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToReleaseLockError instance", () => {
            const error = UnableToReleaseLockError.create("a", "lock-1");
            expect(isLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToForceReleaseLockError instance", () => {
            const error = UnableToForceReleaseLockError.create("a");
            expect(isLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToRefreshLockError instance", () => {
            const error = UnableToRefreshLockError.create("a", "lock-1");
            expect(isLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStateLockError instance", () => {
            const error = UnableToGetStateLockError.create("a");
            expect(isLockError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isLockError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isLockError("")).toBe(false);
            expect(isLockError(null)).toBe(false);
        });
    });
});
