import { beforeEach, describe, expect, test, vi } from "vitest";

import {
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
} from "@/file-storage/contracts/_module-exports.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module-exports.js";
import { handleUnexpectedFileStorageAdapterError } from "@/file-storage/implementations/derivables/file-storage/handle-unexpected-file-storage-adapter-error.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type { ISignedFileStorageAdapter } from "@/file-storage/contracts/_module-exports.js";

type FileStorageAdapterMethod = keyof ISignedFileStorageAdapter;

describe("function: handleUnexpectedFileStorageAdapterError", () => {
    const adapter = new NoOpFileStorageAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const unexpectedError = new Error("Unexpected adapter error");
    const key = "myKey";
    const destination = "myDestination";

    function callMethod(
        method: FileStorageAdapterMethod,
        args: Array<unknown>,
    ): Promise<unknown> {
        const enhanced = withPlugin(
            adapter,
            handleUnexpectedFileStorageAdapterError(),
        );
        const fn = (
            enhanced[method] as unknown as (
                ...callArgs: Array<unknown>
            ) => Promise<unknown>
        ).bind(enhanced);
        return fn(...args);
    }

    const cases: Array<{
        method: FileStorageAdapterMethod;
        args: Array<unknown>;
        expected: unknown;
        errorName: string;
    }> = [
        {
            method: "getPublicUrl",
            args: [key],
            expected: "",
            errorName: UnableToGetPublicUrlFileError.name,
        },
        {
            method: "getSignedDownloadUrl",
            args: [key, {}],
            expected: "",
            errorName: UnableToGetSignedDownloadUrlFileError.name,
        },
        {
            method: "getSignedUploadUrl",
            args: [key, {}],
            expected: "",
            errorName: UnableToGetSignedUploadUrlFileError.name,
        },
        {
            method: "exists",
            args: [key],
            expected: false,
            errorName: UnableToExistsFileError.name,
        },
        {
            method: "getStream",
            args: [key],
            expected: null,
            errorName: UnableToGetStreamFileError.name,
        },
        {
            method: "getBytes",
            args: [key],
            expected: null,
            errorName: UnableToGetBytesFileError.name,
        },
        {
            method: "getMetaData",
            args: [key],
            expected: null,
            errorName: UnableToGetMetaDataFileError.name,
        },
        {
            method: "put",
            args: [key, {}],
            expected: undefined,
            errorName: UnableToPutFileError.name,
        },
        {
            method: "putStream",
            args: [key, {}],
            expected: undefined,
            errorName: UnableToPutStreamFileError.name,
        },
        {
            method: "copy",
            args: [key, destination],
            expected: true,
            errorName: UnableToCopyFileError.name,
        },
        {
            method: "move",
            args: [key, destination],
            expected: true,
            errorName: UnableToMoveFileError.name,
        },
        {
            method: "removeMany",
            args: [[key]],
            expected: undefined,
            errorName: UnableToRemoveManyFileError.name,
        },
        {
            method: "removeByPrefix",
            args: ["prefix"],
            expected: undefined,
            errorName: UnableToRemoveByPrefixFileError.name,
        },
    ];

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    for (const { method, args, expected, errorName } of cases) {
        describe(`method: ${method}`, () => {
            test("Should return adapter result when adapter succeeds", async () => {
                await expect(callMethod(method, args)).resolves.toBe(expected);
            });
            test("Should throw the matching error when adapter rejects", async () => {
                vi.spyOn(adapter, method).mockRejectedValue(unexpectedError);

                const error = await callMethod(method, args).catch(
                    (error_: unknown) => error_,
                );

                expect((error as Error).name).toBe(errorName);
                expect((error as Error).cause).toBe(unexpectedError);
            });
        });
    }

    test("Should throw the matching error when adapter throws synchronously", async () => {
        vi.spyOn(adapter, "getBytes").mockImplementation(() => {
            throw unexpectedError;
        });

        const error = await callMethod("getBytes", [key]).catch(
            (error_: unknown) => error_,
        );

        expect((error as Error).name).toBe(UnableToGetBytesFileError.name);
        expect((error as Error).cause).toBe(unexpectedError);
    });
});
