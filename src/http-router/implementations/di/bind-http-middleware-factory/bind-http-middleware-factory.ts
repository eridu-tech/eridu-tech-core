/**
 * @module HttpRouter
 */

import {
    callInvocable,
    isClass,
    isInvocable,
    UnexpectedError,
} from "@/utilities/_module-exports.js";

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type {
    HttpMiddleware,
    HttpMiddlewareFn,
} from "@/http-router/contracts/_module-exports.js";

function tokenToString(token: DiToken): string {
    if (isClass(token)) {
        return token.name;
    }
    return token.description;
}

/**
 * Creates a binder that turns a DI-registered middleware into an
 * {@link HttpMiddlewareFn}.
 *
 * The binder takes the token of the middleware and resolves it from the
 * container for every request, so the middleware follows the lifetime of its
 * registration and can depend on scoped services. Both middleware functions and
 * invocable objects (values with an `invoke` method) are supported.
 *
 * @param container - The container the middleware is resolved from.
 * @returns A binder that maps a middleware token to an {@link HttpMiddlewareFn}.
 * @throws {@link UnexpectedError} When the resolved middleware is not invocable.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/di"`
 * @group Implementations
 */
export function bindHttpMiddlewareFactory(container: IContainer) {
    return (token: DiToken<HttpMiddleware>): HttpMiddlewareFn => {
        return async (...args) => {
            const middleware = await container.resolveOrFail(token);

            if (!isInvocable(middleware)) {
                throw UnexpectedError.create(
                    `Http middleware registered under token "${tokenToString(
                        token,
                    )}" is not invocable`,
                );
            }

            return callInvocable(middleware, ...args);
        };
    };
}
