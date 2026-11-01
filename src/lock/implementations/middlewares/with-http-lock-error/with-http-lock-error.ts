/**
 * @module Lock
 */
import { HttpError } from "@/http-router/contracts/_module-exports.js";
import {
    FailedAcquireLockError,
    FailedRefreshLockError,
    FailedReleaseLockError,
    isLockError,
    isUnableToLockError,
} from "@/lock/contracts/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { HttpMiddlewareFn } from "@/http-router/contracts/_module-exports.js";
import type { AllLockErrors } from "@/lock/contracts/_module-exports.js";

/**
 * @internal
 */
function toHttpError(lockError: AllLockErrors): HttpError {
    if (lockError instanceof FailedAcquireLockError) {
        return HttpError.create({
            status: "409",
            message: "Lock is not available",
            cause: lockError,
        });
    }
    if (lockError instanceof FailedRefreshLockError) {
        return HttpError.create({
            status: "409",
            message: "Lock is not available",
            cause: lockError,
        });
    }
    if (lockError instanceof FailedReleaseLockError) {
        return HttpError.create({
            status: "409",
            message: "Lock is not available",
            cause: lockError,
        });
    }
    if (isUnableToLockError(lockError)) {
        return HttpError.create({
            status: "503",
            message: "Lock adapter failed",
            cause: lockError,
        });
    }

    throw UnexpectedError.create("Unhandled lock error type");
}

/**
 * Creates an HTTP middleware that converts every lock error thrown by the
 * wrapped handler or middleware into an {@link HttpError}.
 *
 * The original error is preserved as the `cause` of the `HttpError`, and no
 * identifiers are exposed in the response body. Errors that are not lock
 * errors are rethrown untouched.
 *
 * @returns The HTTP middleware.
 *
 * IMPORT_PATH: `"eridu-tech/lock/middlewares"`
 * @group Middlewares
 */
export function withHttpLockError(): HttpMiddlewareFn {
    return async (args) => {
        try {
            return await args.next();
        } catch (error: unknown) {
            if (isLockError(error)) {
                throw toHttpError(error);
            }
            throw error;
        }
    };
}
