/**
 * @module HttpRouter
 */
import {
    callInvocable,
    getInvocableName,
} from "@/utilities/_module-exports.js";

import type {
    HttpHandlerIncomingArgs,
    HttpMiddlewareFn,
    IHttpRes,
} from "@/http-router/contracts/_module-exports.js";
import type { Middleware } from "@/middleware/contracts/_module-exports.js";

/**
 * A generic {@link Middleware} typed for HTTP requests, ready to be turned into
 * an {@link HttpMiddlewareFn} with {@link toHttpMiddleware}.
 *
 * Receives {@link HttpHandlerIncomingArgs} and returns the response.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/middlewares"`
 * @group Implementations
 */
export type ConvertibleHttpMiddleware = Middleware<
    [args: HttpHandlerIncomingArgs],
    Promise<IHttpRes>
>;

/**
 * Converts a {@link ConvertibleHttpMiddleware} into an {@link HttpMiddlewareFn},
 * so it can be registered on a router.
 *
 * The middleware receives `{ req, context }` as its argument and its `next`
 * runs the downstream chain. Arguments passed to that `next` are ignored, and
 * any `priority` is not used — middlewares run in registration order.
 *
 * @param middleware - The middleware to convert.
 * @returns The equivalent {@link HttpMiddlewareFn}.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/middlewares"`
 * @group Implementations
 */
export function toHttpMiddleware(
    middleware: ConvertibleHttpMiddleware,
): HttpMiddlewareFn {
    return (httpArgs) => {
        const { req, context, next } = httpArgs;
        return callInvocable(middleware, {
            args: [{ req, context }],
            next: async () => next(),
            name: getInvocableName(middleware),
        });
    };
}
