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

import type {
    AllFileErrors,
    AllUnableFileErrors,
} from "@/file-storage/contracts/_module-exports.js";
import type { HttpMiddlewareFn } from "@/http-router/contracts/_module-exports.js";

/**
 * @internal
 */
type FileErrorDetails = {
    key?: string;
    source?: string;
    destination?: string;
    keys?: Array<string>;
    prefix?: string;
};

/**
 * @internal
 */
function toDetails(fileError: AllUnableFileErrors): FileErrorDetails {
    const details: FileErrorDetails = {};
    if ("key" in fileError) {
        details.key = fileError.key;
    }
    if ("source" in fileError) {
        details.source = fileError.source;
    }
    if ("destination" in fileError) {
        details.destination = fileError.destination;
    }
    if ("keys" in fileError) {
        details.keys = fileError.keys;
    }
    if ("prefix" in fileError) {
        details.prefix = fileError.prefix;
    }
    return details;
}

/**
 * @internal
 */
function toHttpError(fileError: AllFileErrors): HttpError {
    if (fileError instanceof InvalidKeyFileError) {
        return HttpError.create({
            status: "400",
            message: "File key is invalid",
            details: { key: fileError.key },
            cause: fileError,
        });
    }
    if (fileError instanceof KeyNotFoundFileError) {
        return HttpError.create({
            status: "404",
            message: "File not found",
            details: { key: fileError.key },
            cause: fileError,
        });
    }
    if (isUnableToFileError(fileError)) {
        return HttpError.create({
            status: "503",
            message: "File storage adapter failed",
            details: toDetails(fileError),
            cause: fileError,
        });
    }

    throw UnexpectedError.create("Unhandled file error type");
}

/**
 * Creates an HTTP middleware that converts every file error thrown by the
 * wrapped handler or middleware into an {@link HttpError}.
 *
 * The original error is preserved as the `cause` of the `HttpError`, and the
 * identifiers it carries (`key`, `source`/`destination`, `keys` or `prefix`)
 * are exposed through the error `payload`. Errors that are not file errors are
 * rethrown untouched.
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
