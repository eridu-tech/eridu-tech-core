import { describe, expect, test } from "vitest";

import {
    UnableToDecodeCodecError,
    UnableToEncodeCodecError,
    isCodecError,
} from "@/codec/contracts/codec.errors.js";

describe("file: codec.errors.ts", () => {
    describe("function: isCodecError", () => {
        test("Should return true when given UnableToEncodeCodecError instance", () => {
            const error = UnableToEncodeCodecError.create("boom");
            expect(isCodecError(error)).toBe(true);
        });
        test("Should return true when given UnableToDecodeCodecError instance", () => {
            const error = UnableToDecodeCodecError.create("boom");
            expect(isCodecError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isCodecError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isCodecError("")).toBe(false);
            expect(isCodecError(null)).toBe(false);
        });
    });
});
