/**
 * @module SharedLock
 */
import { HttpError } from "@/http-router/contracts/_module-exports.js";
import {
    FailedAcquireWriterLockError,
    FailedRefreshReaderSemaphoreError,
    FailedRefreshWriterLockError,
    FailedReleaseReaderSemaphoreError,
    FailedReleaseWriterLockError,
    isSharedLockError,
    isUnableToSharedLockError,
    LimitReachedReaderSemaphoreError,
} from "@/shared-lock/contracts/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { HttpMiddlewareFn } from "@/http-router/contracts/_module-exports.js";
import type { AllSharedLockErrors } from "@/shared-lock/contracts/_module-exports.js";

/**
 * @internal
 */
function toHttpError(sharedLockError: AllSharedLockErrors): HttpError {
    if (sharedLockError instanceof LimitReachedReaderSemaphoreError) {
        return HttpError.create({
            status: "429",
            message: "Reader semaphore limit reached",
            cause: sharedLockError,
        });
    }
    if (sharedLockError instanceof FailedRefreshReaderSemaphoreError) {
        return HttpError.create({
            status: "409",
            message: "Shared lock is not available",
            cause: sharedLockError,
        });
    }
    if (sharedLockError instanceof FailedReleaseReaderSemaphoreError) {
        return HttpError.create({
            status: "409",
            message: "Shared lock is not available",
            cause: sharedLockError,
        });
    }
    if (sharedLockError instanceof FailedAcquireWriterLockError) {
        return HttpError.create({
            status: "409",
            message: "Shared lock is not available",
            cause: sharedLockError,
        });
    }
    if (sharedLockError instanceof FailedRefreshWriterLockError) {
        return HttpError.create({
            status: "409",
            message: "Shared lock is not available",
            cause: sharedLockError,
        });
    }
    if (sharedLockError instanceof FailedReleaseWriterLockError) {
        return HttpError.create({
            status: "409",
            message: "Shared lock is not available",
            cause: sharedLockError,
        });
    }
    if (isUnableToSharedLockError(sharedLockError)) {
        return HttpError.create({
            status: "503",
            message: "Shared lock adapter failed",
            cause: sharedLockError,
        });
    }

    throw UnexpectedError.create("Unhandled shared lock error type");
}

/**
 * Creates an HTTP middleware that converts every shared-lock error thrown by
 * the wrapped handler or middleware into an {@link HttpError}.
 *
 * The original error is preserved as the `cause` of the `HttpError`, and no
 * identifiers are exposed in the response body. Errors that are not
 * shared-lock errors are rethrown untouched.
 *
 * @returns The HTTP middleware.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/middlewares"`
 * @group Middlewares
 */
export function withHttpSharedLockError(): HttpMiddlewareFn {
    return async (args) => {
        try {
            return await args.next();
        } catch (error: unknown) {
            if (isSharedLockError(error)) {
                throw toHttpError(error);
            }
            throw error;
        }
    };
}
