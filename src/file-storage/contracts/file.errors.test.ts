import { describe, expect, test } from "vitest";

import {
    InvalidKeyFileError,
    isFileError,
    isUnableToFileError,
    KeyNotFoundFileError,
    UnableToCopyFileError,
    UnableToExistsFileError,
    UnableToGetBytesFileError,
    UnableToGetMetaDataFileError,
    UnableToGetPublicUrlFileError,
    UnableToGetSignedDownloadUrlFileError,
    UnableToGetSignedUploadUrlFileError,
    UnableToGetStreamFileError,
    UnableToMoveFileError,
    UnableToPutFileError,
    UnableToPutStreamFileError,
    UnableToRemoveByPrefixFileError,
    UnableToRemoveManyFileError,
} from "@/file-storage/contracts/file.errors.js";

describe("file: file.errors.ts", () => {
    describe("function: isFileError", () => {
        test("Should return true when given KeyNotFoundFileError instance", () => {
            const error = KeyNotFoundFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given InvalidKeyFileError instance", () => {
            const error = InvalidKeyFileError.create("a", "invalid");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetPublicUrlFileError instance", () => {
            const error = UnableToGetPublicUrlFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetSignedDownloadUrlFileError instance", () => {
            const error = UnableToGetSignedDownloadUrlFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetSignedUploadUrlFileError instance", () => {
            const error = UnableToGetSignedUploadUrlFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToExistsFileError instance", () => {
            const error = UnableToExistsFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStreamFileError instance", () => {
            const error = UnableToGetStreamFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetBytesFileError instance", () => {
            const error = UnableToGetBytesFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetMetaDataFileError instance", () => {
            const error = UnableToGetMetaDataFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToPutFileError instance", () => {
            const error = UnableToPutFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToPutStreamFileError instance", () => {
            const error = UnableToPutStreamFileError.create("a");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToCopyFileError instance", () => {
            const error = UnableToCopyFileError.create("a", "b");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToMoveFileError instance", () => {
            const error = UnableToMoveFileError.create("a", "b");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToRemoveManyFileError instance", () => {
            const error = UnableToRemoveManyFileError.create(["a", "b"]);
            expect(isFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToRemoveByPrefixFileError instance", () => {
            const error = UnableToRemoveByPrefixFileError.create("prefix");
            expect(isFileError(error)).toBe(true);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isFileError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isFileError("")).toBe(false);
            expect(isFileError(null)).toBe(false);
        });
    });
    describe("function: isUnableToFileError", () => {
        test("Should return true when given UnableToGetPublicUrlFileError instance", () => {
            const error = UnableToGetPublicUrlFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetSignedDownloadUrlFileError instance", () => {
            const error = UnableToGetSignedDownloadUrlFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetSignedUploadUrlFileError instance", () => {
            const error = UnableToGetSignedUploadUrlFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToExistsFileError instance", () => {
            const error = UnableToExistsFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetStreamFileError instance", () => {
            const error = UnableToGetStreamFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetBytesFileError instance", () => {
            const error = UnableToGetBytesFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToGetMetaDataFileError instance", () => {
            const error = UnableToGetMetaDataFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToPutFileError instance", () => {
            const error = UnableToPutFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToPutStreamFileError instance", () => {
            const error = UnableToPutStreamFileError.create("a");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToCopyFileError instance", () => {
            const error = UnableToCopyFileError.create("a", "b");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToMoveFileError instance", () => {
            const error = UnableToMoveFileError.create("a", "b");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToRemoveManyFileError instance", () => {
            const error = UnableToRemoveManyFileError.create(["a", "b"]);
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return true when given UnableToRemoveByPrefixFileError instance", () => {
            const error = UnableToRemoveByPrefixFileError.create("prefix");
            expect(isUnableToFileError(error)).toBe(true);
        });
        test("Should return false when given a KeyNotFoundFileError instance", () => {
            const error = KeyNotFoundFileError.create("a");
            expect(isUnableToFileError(error)).toBe(false);
        });
        test("Should return false when given an InvalidKeyFileError instance", () => {
            const error = InvalidKeyFileError.create("a", "invalid");
            expect(isUnableToFileError(error)).toBe(false);
        });
        test("Should return false when given a generic Error instance", () => {
            expect(isUnableToFileError(new Error("generic"))).toBe(false);
        });
        test("Should return false when given a non-error value", () => {
            expect(isUnableToFileError("")).toBe(false);
            expect(isUnableToFileError(null)).toBe(false);
        });
    });
});
