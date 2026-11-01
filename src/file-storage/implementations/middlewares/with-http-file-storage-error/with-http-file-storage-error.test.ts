import { describe, expect, test } from "vitest";

import {
    InvalidKeyFileError,
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
} from "@/file-storage/contracts/_module-exports.js";
import { withHttpFileStorageError } from "@/file-storage/implementations/middlewares/with-http-file-storage-error/with-http-file-storage-error.js";
import {
    defaultHttpRouterAdapter,
    HttpRouter,
} from "@/http-router/implementations/http-router.js";

import type { AllFileErrors } from "@/file-storage/contracts/_module-exports.js";
import type { IHttpRouter } from "@/http-router/contracts/_module-exports.js";

type TestData = {
    name: string;
    status: number;
    message: string;
    error: AllFileErrors;
    payload: Record<string, unknown>;
};

function createRouter(): IHttpRouter {
    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    router.use(withHttpFileStorageError());
    return router;
}

async function fetchWithError(error: unknown): Promise<Response> {
    const router = createRouter();
    router.endpoint({
        url: "/error",
        method: ["GET"],
        handler: () => {
            throw error;
        },
    });

    return router.fetch(new Request("https://example.com/error"));
}

describe("file: with-http-file-storage-error.ts", () => {
    describe("function: withHttpFileStorageError", () => {
        const testCases: Array<TestData> = [
            {
                name: "InvalidKeyFileError",
                status: 400,
                message: "File key is invalid",
                error: InvalidKeyFileError.create("a", "invalid key"),
                payload: { key: "a" },
            },
            {
                name: "KeyNotFoundFileError",
                status: 404,
                message: "File not found",
                error: KeyNotFoundFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToGetPublicUrlFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToGetPublicUrlFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToGetSignedDownloadUrlFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToGetSignedDownloadUrlFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToGetSignedUploadUrlFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToGetSignedUploadUrlFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToExistsFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToExistsFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToGetStreamFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToGetStreamFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToGetBytesFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToGetBytesFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToGetMetaDataFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToGetMetaDataFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToPutFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToPutFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToPutStreamFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToPutStreamFileError.create("a"),
                payload: { key: "a" },
            },
            {
                name: "UnableToCopyFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToCopyFileError.create("source-1", "dest-1"),
                payload: { source: "source-1", destination: "dest-1" },
            },
            {
                name: "UnableToMoveFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToMoveFileError.create("source-1", "dest-1"),
                payload: { source: "source-1", destination: "dest-1" },
            },
            {
                name: "UnableToRemoveManyFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToRemoveManyFileError.create(["a", "b"]),
                payload: { keys: ["a", "b"] },
            },
            {
                name: "UnableToRemoveByPrefixFileError",
                status: 503,
                message: "File storage adapter failed",
                error: UnableToRemoveByPrefixFileError.create("prefix-1"),
                payload: { prefix: "prefix-1" },
            },
        ];

        test.each(testCases)(
            "Should convert $name to an HttpError response with status $status",
            async (testCase) => {
                const response = await fetchWithError(testCase.error);

                expect(response.status).toBe(testCase.status);
                await expect(response.json()).resolves.toEqual({
                    name: "HttpError",
                    status: String(testCase.status),
                    message: testCase.message,
                    payload: testCase.payload,
                });
            },
        );
        test("Should return a generic 500 response when the error is not a file error", async () => {
            const response = await fetchWithError(new Error("generic"));

            expect(response.status).toBe(500);
            await expect(response.text()).resolves.toBe(
                "Unexpected error occurred",
            );
        });
        test("Should return the endpoint response when nothing is thrown", async () => {
            const router = createRouter();
            router.endpoint({
                url: "/ok",
                method: ["GET"],
                handler: (args) => args.json({ ok: true }),
            });

            const response = await router.fetch(
                new Request("https://example.com/ok"),
            );

            expect(response.status).toBe(200);
            await expect(response.json()).resolves.toEqual({ ok: true });
        });
    });
});
