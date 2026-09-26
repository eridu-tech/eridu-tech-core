/**
 * @module HttpRouter
 */

import { genericToken } from "@/di/contracts/_module.js";

import type { IContainer } from "@/di/contracts/_module.js";
import type {
    HttpMiddlewareFn,
    IHttpReq,
} from "@/http-router/contracts/_module.js";

/**
 * The token the incoming {@link IHttpReq} is registered under inside the request
 * scope.
 *
 * {@link registerRequest} declares it as a dynamic token; resolve it inside a
 * handler to reach the current request without threading it through every
 * call.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/di"`
 * @group Implementations
 */
export const REQUEST = genericToken<IHttpReq>("request");

/**
 * Creates a middleware that opens a container scope for the duration of a
 * request and registers the incoming {@link IHttpReq} under {@link REQUEST}.
 *
 * {@link REQUEST} is declared as a dynamic token by this function, so the
 * middleware has to be created before the container is initialized and only once
 * per container. Each request then gets its own scope, so services resolved while
 * the request is handled can read the request from the container without it
 * leaking into another request.
 *
 * @param container - The container the request scope is opened on.
 * @returns The request-scoping middleware.
 * @throws {@link InvalidMethodCallDiError} When the container is already initialized.
 * @throws {@link CanNotRegisterServiceDiError} When {@link REQUEST} is already registered.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/di"`
 * @group Implementations
 */
export function registerRequest(container: IContainer): HttpMiddlewareFn {
    container.registerDynamic(REQUEST);
    return async (args) => {
        return container.run({
            registration: (register) => {
                register.set({
                    token: REQUEST,
                    value: args.req,
                });
            },
            scope: () => {
                return args.next();
            },
        });
    };
}
