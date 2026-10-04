/**
 * @module HttpRouter
 */

import {
    callInvocable,
    isInvocable,
    UnexpectedError,
} from "@/utilities/_module-exports.js";

import type { ConditionalPick } from "type-fest";

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type {
    HttpHandlerFn,
    HttpHandler,
} from "@/http-router/contracts/_module-exports.js";

/**
 * Creates a binder that turns a controller method into an {@link HttpHandlerFn}.
 *
 * The binder takes the controller's token and the name of one of its handler
 * methods, resolves the controller from the container for each request, and
 * invokes the bound method. Declare handler methods as arrow function
 * properties so `this` stays bound to the controller instance.
 *
 * @param container - The container the controller is resolved from.
 * @returns A binder that maps a controller method to an {@link HttpHandlerFn}.
 * @throws {@link UnexpectedError} When the bound member is not invocable.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/di"`
 * @group Implementations
 */
export function bindHttpFactory(container: IContainer) {
    return <TInstance extends object>(
        token: DiToken<TInstance>,
        method: keyof ConditionalPick<TInstance, HttpHandler>,
    ): HttpHandlerFn => {
        return async (...args) => {
            const controller = await container.resolveOrFail(token);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const handler = controller[
                method as keyof TInstance
            ] as HttpHandler;

            if (!isInvocable(handler)) {
                throw new UnexpectedError(
                    `Controller method "${String(method)}" is not invocable`,
                );
            }

            return callInvocable(handler, ...args);
        };
    };
}
