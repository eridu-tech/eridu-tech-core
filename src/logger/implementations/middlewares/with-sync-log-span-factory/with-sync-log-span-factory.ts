/**
 * @module Observability
 */

import type { ILoggerResolver } from "@/logger/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Synchronous variant of `WithLogSpan`: runs the wrapped function inside a
 * span named `name` via the selected logger's `span`, so entries logged by it
 * carry the elapsed time of every open span.
 *
 * @param name - Name of the span.
 *
 * @typeParam TParameters - Arguments of the wrapped function.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type WithSyncLogSpan = <TParameters extends Array<unknown>, TReturn>(
    name: string,
) => MiddlewareFn<TParameters, TReturn>;

/**
 * Resolver-facing API returned by {@link withSyncLogSpanFactory}.
 *
 * Calling `use()` returns a {@link WithSyncLogSpan} bound to the selected
 * transport.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type WithSyncLogSpanResolver<TTransports extends string = string> = {
    /**
     * Selects the transport the returned middleware factory uses.
     *
     * @param transportName - The transport to use. Defaults to the resolver's
     * default transport.
     * @returns A {@link WithSyncLogSpan} bound to the selected transport.
     */
    use(transportName?: TTransports): WithSyncLogSpan;
};

/**
 * Creates a `WithSyncLogSpan` factory bound to `loggerResolver`.
 *
 * Calling the returned function uses the resolver's default transport, while
 * `use()` selects a specific one.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 * @param loggerResolver - Resolver used to select the logger that opens the span.
 * @returns A {@link WithSyncLogSpan} that is also a
 *          {@link WithSyncLogSpanResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export function withSyncLogSpanFactory<TTransports extends string = string>(
    loggerResolver: ILoggerResolver<TTransports>,
): WithSyncLogSpan & WithSyncLogSpanResolver<TTransports> {
    const withSyncLogSpanResolver: WithSyncLogSpanResolver<TTransports>["use"] =
        (transportName) => {
            return (name) => {
                return ({ next }) => {
                    return loggerResolver.use(transportName).span(name, next);
                };
            };
        };

    const middleware = withSyncLogSpanResolver() as WithSyncLogSpan &
        WithSyncLogSpanResolver<TTransports>;
    middleware.use = withSyncLogSpanResolver;
    return middleware;
}
