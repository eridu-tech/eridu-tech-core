/**
 * @module RateLimiter
 */
import { HttpError } from "@/http-router/contracts/_module-exports.js";
import {
    BlockedRateLimiterError,
    isRateLimiterError,
    isUnableToRateLimiterError,
} from "@/rate-limiter/contracts/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { HttpMiddlewareFn } from "@/http-router/contracts/_module-exports.js";
import type { AllRateLimiterErrors } from "@/rate-limiter/contracts/_module-exports.js";

/**
 * @internal
 */
function toHttpError(rateLimiterError: AllRateLimiterErrors): HttpError {
    if (rateLimiterError instanceof BlockedRateLimiterError) {
        const retryAfter = Math.ceil(
            rateLimiterError.state.retryAfter.toMilliseconds() / 1000,
        );
        return HttpError.create({
            status: "429",
            message: "Too many requests",
            headers: {
                RateLimit: String(rateLimiterError.state.limit),
                "Retry-After": String(retryAfter),
            },
            cause: rateLimiterError,
        });
    }

    if (isUnableToRateLimiterError(rateLimiterError)) {
        return HttpError.create({
            status: "503",
            message: "Rate limiter adapter failed",
            cause: rateLimiterError,
        });
    }

    throw UnexpectedError.create("Unhandled rate limiter error type");
}

/**
 * Creates an HTTP middleware that converts every rate limiter error thrown by
 * the wrapped handler or middleware into an {@link HttpError}.
 *
 * The original error is preserved as the `cause` of the `HttpError`. Blocked
 * errors additionally set the `RateLimit` and `Retry-After` headers. Errors
 * that are not rate limiter errors are rethrown untouched.
 *
 * @returns The HTTP middleware.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/middlewares"`
 * @group Middlewares
 */
export function withHttpRateLimiterError(): HttpMiddlewareFn {
    return async (args) => {
        try {
            return await args.next();
        } catch (error: unknown) {
            if (isRateLimiterError(error)) {
                throw toHttpError(error);
            }
            throw error;
        }
    };
}
