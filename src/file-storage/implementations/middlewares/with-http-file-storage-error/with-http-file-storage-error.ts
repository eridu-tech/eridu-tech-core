/**
 * @module FileStorage
 */
import {
    InvalidKeyFileError,
    isFileError,
    isUnableToFileError,
    KeyNotFoundFileError,
} from "@/file-storage/contracts/_module-exports.js";
import { HttpError } from "@/http-router/contracts/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { AllFileErrors } from "@/file-storage/contracts/_module-exports.js";
import type { HttpMiddlewareFn } from "@/http-router/contracts/_module-exports.js";

/**
 * @internal
 */
function toHttpError(fileError: AllFileErrors): HttpError {
    if (fileError instanceof InvalidKeyFileError) {
        return HttpError.create({
            status: "400",
            message: "File key is invalid",
            cause: fileError,
        });
    }
    if (fileError instanceof KeyNotFoundFileError) {
        return HttpError.create({
            status: "404",
            message: "File not found",
            cause: fileError,
        });
    }
    if (isUnableToFileError(fileError)) {
        return HttpError.create({
            status: "503",
            message: "File storage adapter failed",
            cause: fileError,
        });
    }

    throw UnexpectedError.create("Unhandled file error type");
}

/**
 * Creates an HTTP middleware that converts every file error thrown by the
 * wrapped handler or middleware into an {@link HttpError}.
 *
 * The original error is preserved as the `cause` of the `HttpError`, and no
 * identifiers are exposed in the response body. Errors that are not file
 * errors are rethrown untouched.
 *
 * @returns The HTTP middleware.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/middlewares"`
 * @group Middlewares
 */
export function withHttpFileStorageError(): HttpMiddlewareFn {
    return async (args) => {
        try {
            return await args.next();
        } catch (error: unknown) {
            if (isFileError(error)) {
                throw toHttpError(error);
            }
            throw error;
        }
    };
}
