/**
 * @module HttpRouter
 */

import type { IContext } from "@/execution-context/contracts/_module-exports.js";
import type { IHttpReq } from "@/http-router/contracts/http-req.contract.js";
import type {
    IHttpRes,
    IHttpResHelpers,
} from "@/http-router/contracts/http-res.contract.js";
import type {
    IInvocableObject,
    InvocableFn,
    Promisable,
} from "@/utilities/_module-exports.js";

/**
 * Arguments used to build the outgoing response: the response builder plus the
 * helpers that fill it in (`text`, `json`, `notFound`, ...).
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpHandlerOutgoingArgs = IHttpResHelpers & {
    /**
     * The outgoing HTTP response builder.
     */
    res: IHttpRes;
};

/**
 * Arguments describing the incoming request: the request itself and the
 * execution context shared across its lifecycle.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpHandlerIncomingArgs = {
    /**
     * The incoming HTTP request.
     */
    req: IHttpReq;

    /**
     * The shared execution context for the request lifecycle.
     */
    context: IContext;
};

/**
 * The arguments passed to a request handler function or object.
 * Unlike middleware, handlers do not receive a `next` function.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpHandlerArgs = HttpHandlerIncomingArgs & HttpHandlerOutgoingArgs;

/**
 * An invocable object that handles an HTTP request.
 * Receives handler args ({@link HttpHandlerArgs}) and returns a response.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type IHttpHandlerObject = IInvocableObject<
    [args: HttpHandlerArgs],
    Promisable<IHttpRes>
>;

/**
 * A function that handles an HTTP request.
 * Receives handler args ({@link HttpHandlerArgs}) and returns a response.
 *
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpHandlerFn = InvocableFn<
    [args: HttpHandlerArgs],
    Promisable<IHttpRes>
>;

/**
 * A union of all handler forms: a function or an invocable object.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpHandler = HttpHandlerFn | IHttpHandlerObject;
