/**
 * @module Semaphore
 */
import { HttpError } from "@/http-router/contracts/_module-exports.js";
import {
    FailedRefreshSemaphoreError,
    FailedReleaseSemaphoreError,
    isSemaphoreError,
    isUnableToSemaphoreError,
    LimitReachedSemaphoreError,
} from "@/semaphore/contracts/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { HttpMiddlewareFn } from "@/http-router/contracts/_module-exports.js";
import type { AllSemaphoreErrors } from "@/semaphore/contracts/_module-exports.js";

/**
 * @internal
 */
function toHttpError(semaphoreError: AllSemaphoreErrors): HttpError {
    if (semaphoreError instanceof LimitReachedSemaphoreError) {
        return HttpError.create({
            status: "429",
            message: "Semaphore limit reached",
            cause: semaphoreError,
        });
    }
    if (semaphoreError instanceof FailedRefreshSemaphoreError) {
        return HttpError.create({
            status: "409",
            message: "Semaphore slot is no longer valid",
            cause: semaphoreError,
        });
    }
    if (semaphoreError instanceof FailedReleaseSemaphoreError) {
        return HttpError.create({
            status: "409",
            message: "Semaphore slot is no longer valid",
            cause: semaphoreError,
        });
    }
    if (isUnableToSemaphoreError(semaphoreError)) {
        return HttpError.create({
            status: "503",
            message: "Semaphore adapter failed",
            cause: semaphoreError,
        });
    }

    throw UnexpectedError.create("Unhandled semaphore error type");
}

/**
 * Creates an HTTP middleware that converts every semaphore error thrown by the
 * wrapped handler or middleware into an {@link HttpError}.
 *
 * The original error is preserved as the `cause` of the `HttpError`, and no
 * identifiers are exposed in the response body. Errors that are not semaphore
 * errors are rethrown untouched.
 *
 * @returns The HTTP middleware.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares"`
 * @group Middlewares
 */
export function withHttpSemaphoreError(): HttpMiddlewareFn {
    return async (args) => {
        try {
            return await args.next();
        } catch (error: unknown) {
            if (isSemaphoreError(error)) {
                throw toHttpError(error);
            }
            throw error;
        }
    };
}
