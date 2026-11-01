import { describe, expect, test } from "vitest";

import {
    FailedAcquireWriterLockError,
    FailedRefreshReaderSemaphoreError,
    FailedRefreshWriterLockError,
    FailedReleaseReaderSemaphoreError,
    FailedReleaseWriterLockError,
    isReaderSemaphoreError,
    isSharedLockError,
    isUnableToReaderSemaphoreError,
    isUnableToSharedLockError,
    isUnableToWriterLockError,
    isWriterLockError,
    LimitReachedReaderSemaphoreError,
    UnableToAcquireReaderSemaphoreError,
    UnableToAcquireWriterLockError,
    UnableToForceReleaseSharedLockError,
    UnableToGetStateSharedLockError,
    UnableToRefreshReaderSemaphoreError,
    UnableToRefreshWriterLockError,
    UnableToReleaseReaderSemaphoreError,
    UnableToReleaseWriterLockError,
} from "@/shared-lock/contracts/shared-lock.errors.js";

describe("file: shared-lock.errors.ts", () => {
    describe("function: isReaderSemaphoreError", () => {
        test("Should return true when given LimitReachedReaderSemaphoreError instance", () => {
            const error = LimitReachedReaderSemaphoreError.create("a");
            expect(isReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given FailedRefreshReaderSemaphoreError instance", () => {
            const error = FailedRefreshReaderSemaphoreError.create(
                "a",
                "slot-1",
            );
            expect(isReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given FailedReleaseReaderSemaphoreError instance", () => {
            const error = FailedReleaseReaderSemaphoreError.create(
                "a",
                "slot-1",
            );
            expect(isReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToAcquireReaderSemaphoreError instance", () => {
            const error = UnableToAcquireReaderSemaphoreError.create("a");
            expect(isReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToReleaseReaderSemaphoreError instance", () => {
            const error = UnableToReleaseReaderSemaphoreError.create(
                "a",
                "slot-1",
            );
            expect(isReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToRefreshReaderSemaphoreError instance", () => {
            const error = UnableToRefreshReaderSemaphoreError.create(
                "a",
                "slot-1",
            );
            expect(isReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return false when given a writer lock error instance", () => {
            const error = FailedAcquireWriterLockError.create("a");
            expect(isReaderSemaphoreError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isReaderSemaphoreError(new Error("generic"))).toBe(false);
        });
    });
    describe("function: isWriterLockError", () => {
        test("Should return true when given FailedAcquireWriterLockError instance", () => {
            const error = FailedAcquireWriterLockError.create("a");
            expect(isWriterLockError(error)).toBe(true);
        });
        test("Should return true when given FailedReleaseWriterLockError instance", () => {
            const error = FailedReleaseWriterLockError.create("a", "lock-1");
            expect(isWriterLockError(error)).toBe(true);
        });
        test("Should return true when given FailedRefreshWriterLockError instance", () => {
            const error = FailedRefreshWriterLockError.create("a", "lock-1");
            expect(isWriterLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToAcquireWriterLockError instance", () => {
            const error = UnableToAcquireWriterLockError.create("a", "lock-1");
            expect(isWriterLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToReleaseWriterLockError instance", () => {
            const error = UnableToReleaseWriterLockError.create("a", "lock-1");
            expect(isWriterLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToRefreshWriterLockError instance", () => {
            const error = UnableToRefreshWriterLockError.create("a", "lock-1");
            expect(isWriterLockError(error)).toBe(true);
        });
        test("Should return false when given a reader semaphore error instance", () => {
            const error = LimitReachedReaderSemaphoreError.create("a");
            expect(isWriterLockError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isWriterLockError(new Error("generic"))).toBe(false);
        });
    });
    describe("function: isUnableToReaderSemaphoreError", () => {
        test("Should return true when given UnableToAcquireReaderSemaphoreError instance", () => {
            const error = UnableToAcquireReaderSemaphoreError.create("a");
            expect(isUnableToReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToReleaseReaderSemaphoreError instance", () => {
            const error = UnableToReleaseReaderSemaphoreError.create(
                "a",
                "slot-1",
            );
            expect(isUnableToReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return true when given UnableToRefreshReaderSemaphoreError instance", () => {
            const error = UnableToRefreshReaderSemaphoreError.create(
                "a",
                "slot-1",
            );
            expect(isUnableToReaderSemaphoreError(error)).toBe(true);
        });
        test("Should return false when given a LimitReachedReaderSemaphoreError instance", () => {
            const error = LimitReachedReaderSemaphoreError.create("a");
            expect(isUnableToReaderSemaphoreError(error)).toBe(false);
        });
        test("Should return false when given a writer lock error instance", () => {
            const error = UnableToAcquireWriterLockError.create("a", "lock-1");
            expect(isUnableToReaderSemaphoreError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isUnableToReaderSemaphoreError(new Error("generic"))).toBe(
                false,
            );
        });
    });
    describe("function: isUnableToWriterLockError", () => {
        test("Should return true when given UnableToAcquireWriterLockError instance", () => {
            const error = UnableToAcquireWriterLockError.create("a", "lock-1");
            expect(isUnableToWriterLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToReleaseWriterLockError instance", () => {
            const error = UnableToReleaseWriterLockError.create("a", "lock-1");
            expect(isUnableToWriterLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToRefreshWriterLockError instance", () => {
            const error = UnableToRefreshWriterLockError.create("a", "lock-1");
            expect(isUnableToWriterLockError(error)).toBe(true);
        });
        test("Should return false when given a FailedAcquireWriterLockError instance", () => {
            const error = FailedAcquireWriterLockError.create("a");
            expect(isUnableToWriterLockError(error)).toBe(false);
        });
        test("Should return false when given a reader semaphore error instance", () => {
            const error = UnableToAcquireReaderSemaphoreError.create("a");
            expect(isUnableToWriterLockError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isUnableToWriterLockError(new Error("generic"))).toBe(false);
        });
    });
    describe("function: isUnableToSharedLockError", () => {
        test("Should return true when given a reader semaphore error instance", () => {
            const error = UnableToAcquireReaderSemaphoreError.create("a");
            expect(isUnableToSharedLockError(error)).toBe(true);
        });
        test("Should return true when given a writer lock error instance", () => {
            const error = UnableToRefreshWriterLockError.create("a", "lock-1");
            expect(isUnableToSharedLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToForceReleaseSharedLockError instance", () => {
            const error = UnableToForceReleaseSharedLockError.create("a");
            expect(isUnableToSharedLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStateSharedLockError instance", () => {
            const error = UnableToGetStateSharedLockError.create("a");
            expect(isUnableToSharedLockError(error)).toBe(true);
        });
        test("Should return false when given a LimitReachedReaderSemaphoreError instance", () => {
            const error = LimitReachedReaderSemaphoreError.create("a");
            expect(isUnableToSharedLockError(error)).toBe(false);
        });
        test("Should return false when given a FailedAcquireWriterLockError instance", () => {
            const error = FailedAcquireWriterLockError.create("a");
            expect(isUnableToSharedLockError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isUnableToSharedLockError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isUnableToSharedLockError("")).toBe(false);
            expect(isUnableToSharedLockError(null)).toBe(false);
        });
    });
    describe("function: isSharedLockError", () => {
        test("Should return true when given a reader semaphore error instance", () => {
            const error = LimitReachedReaderSemaphoreError.create("a");
            expect(isSharedLockError(error)).toBe(true);
        });
        test("Should return true when given a writer lock error instance", () => {
            const error = FailedAcquireWriterLockError.create("a");
            expect(isSharedLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToForceReleaseSharedLockError instance", () => {
            const error = UnableToForceReleaseSharedLockError.create("a");
            expect(isSharedLockError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStateSharedLockError instance", () => {
            const error = UnableToGetStateSharedLockError.create("a");
            expect(isSharedLockError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isSharedLockError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isSharedLockError("")).toBe(false);
            expect(isSharedLockError(null)).toBe(false);
        });
    });
});
