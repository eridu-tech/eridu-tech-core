import { describe, expect, test } from "vitest";

import {
    isCircuitBreakerError,
    isUnableToCircuitBreakerError,
    IsolatedCircuitBreakerError,
    OpenCircuitBreakerError,
    UnableToGetStateCircuitBreakerError,
    UnableToIsolateCircuitBreakerError,
    UnableToResetCircuitBreakerError,
    UnableToTrackFailureCircuitBreakerError,
    UnableToTrackSuccessCircuitBreakerError,
    UnableToUpdateStateCircuitBreakerError,
} from "@/circuit-breaker/contracts/circuit-breaker.errors.js";

describe("file: circuit-breaker.errors.ts", () => {
    describe("function: isCircuitBreakerError", () => {
        test("Should return true when given OpenCircuitBreakerError instance", () => {
            const error = OpenCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given IsolatedCircuitBreakerError instance", () => {
            const error = IsolatedCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStateCircuitBreakerError instance", () => {
            const error = UnableToGetStateCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToUpdateStateCircuitBreakerError instance", () => {
            const error = UnableToUpdateStateCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToIsolateCircuitBreakerError instance", () => {
            const error = UnableToIsolateCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToTrackFailureCircuitBreakerError instance", () => {
            const error = UnableToTrackFailureCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToTrackSuccessCircuitBreakerError instance", () => {
            const error = UnableToTrackSuccessCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToResetCircuitBreakerError instance", () => {
            const error = UnableToResetCircuitBreakerError.create("a");
            expect(isCircuitBreakerError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isCircuitBreakerError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isCircuitBreakerError("")).toBe(false);
            expect(isCircuitBreakerError(null)).toBe(false);
        });
    });
    describe("function: isUnableToCircuitBreakerError", () => {
        test("Should return true when given UnableToGetStateCircuitBreakerError instance", () => {
            const error = UnableToGetStateCircuitBreakerError.create("a");
            expect(isUnableToCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToUpdateStateCircuitBreakerError instance", () => {
            const error = UnableToUpdateStateCircuitBreakerError.create("a");
            expect(isUnableToCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToIsolateCircuitBreakerError instance", () => {
            const error = UnableToIsolateCircuitBreakerError.create("a");
            expect(isUnableToCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToTrackFailureCircuitBreakerError instance", () => {
            const error = UnableToTrackFailureCircuitBreakerError.create("a");
            expect(isUnableToCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToTrackSuccessCircuitBreakerError instance", () => {
            const error = UnableToTrackSuccessCircuitBreakerError.create("a");
            expect(isUnableToCircuitBreakerError(error)).toBe(true);
        });
        test("Should return true when given UnableToResetCircuitBreakerError instance", () => {
            const error = UnableToResetCircuitBreakerError.create("a");
            expect(isUnableToCircuitBreakerError(error)).toBe(true);
        });
        test("Should return false when given an OpenCircuitBreakerError instance", () => {
            const error = OpenCircuitBreakerError.create("a");
            expect(isUnableToCircuitBreakerError(error)).toBe(false);
        });
        test("Should return false when given an IsolatedCircuitBreakerError instance", () => {
            const error = IsolatedCircuitBreakerError.create("a");
            expect(isUnableToCircuitBreakerError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isUnableToCircuitBreakerError(new Error("generic"))).toBe(
                false,
            );
        });
        test("Should return false when given a non-error value", () => {
            expect(isUnableToCircuitBreakerError("")).toBe(false);
            expect(isUnableToCircuitBreakerError(null)).toBe(false);
        });
    });
});
