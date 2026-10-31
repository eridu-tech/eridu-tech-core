import { describe, expect, test } from "vitest";

import {
    isEventBusError,
    UnableToAddListenerEventBusError,
    UnableToDispatchEventBusError,
    UnableToRemoveListenerEventBusError,
} from "@/event-bus/contracts/event-bus.errors.js";

describe("file: event-bus.errors.ts", () => {
    describe("function: isEventBusError", () => {
        test("Should return true when given UnableToDispatchEventBusError instance", () => {
            const error = UnableToDispatchEventBusError.create("event");
            expect(isEventBusError(error)).toBe(true);
        });
        test("Should return true when given UnableToAddListenerEventBusError instance", () => {
            const error = UnableToAddListenerEventBusError.create("event");
            expect(isEventBusError(error)).toBe(true);
        });
        test("Should return true when given UnableToRemoveListenerEventBusError instance", () => {
            const error = UnableToRemoveListenerEventBusError.create("event");
            expect(isEventBusError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isEventBusError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isEventBusError("")).toBe(false);
            expect(isEventBusError(null)).toBe(false);
        });
    });
});
