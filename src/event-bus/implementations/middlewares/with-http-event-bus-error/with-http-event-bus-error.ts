/**
 * @module EventBus
 */
import { isEventBusError } from "@/event-bus/contracts/_module-exports.js";
import { HttpError } from "@/http-router/contracts/_module-exports.js";

import type { AllEventBusErrors } from "@/event-bus/contracts/_module-exports.js";
import type { HttpMiddlewareFn } from "@/http-router/contracts/_module-exports.js";

/**
 * @internal
 */
function toHttpError(eventBusError: AllEventBusErrors): HttpError {
    return HttpError.create({
        status: "503",
        message: "Event bus adapter failed",
        cause: eventBusError,
    });
}

/**
 * Creates an HTTP middleware that converts every event bus error thrown by the
 * wrapped handler or middleware into an {@link HttpError}.
 *
 * The original error is preserved as the `cause` of the `HttpError`, and no
 * identifiers are exposed in the response body. Errors that are not event bus
 * errors are rethrown untouched.
 *
 * @returns The HTTP middleware.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export function withHttpEventBusError(): HttpMiddlewareFn {
    return async (args) => {
        try {
            return await args.next();
        } catch (error: unknown) {
            if (isEventBusError(error)) {
                throw toHttpError(error);
            }
            throw error;
        }
    };
}
