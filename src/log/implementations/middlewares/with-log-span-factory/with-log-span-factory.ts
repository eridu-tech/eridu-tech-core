/**
 * @module Log
 */
import type { ILogResolver } from "@/log/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Runs the wrapped function inside a span named `name` via the selected
 * log's `run`, so entries logged by it carry the elapsed time of every
 * open span.
 *
 * @param name - Name of the span.
 *
 * @typeParam TParameters - Arguments of the wrapped function.
 * @typeParam TReturn - Resolved return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export type WithLogSpan = <TParameters extends Array<unknown>, TReturn>(
    name: string,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withLogSpanFactory}.
 *
 * Calling `use()` returns a {@link WithLogSpan} bound to the selected
 * transport.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export type WithLogSpanResolver<TTransports extends string = string> = {
    /**
     * Selects the transport the returned middleware factory uses.
     *
     * @param transportName - The transport to use. Defaults to the resolver's
     * default transport.
     * @returns A {@link WithLogSpan} bound to the selected transport.
     */
    use(transportName?: TTransports): WithLogSpan;
};

/**
 * Creates a `WithLogSpan` factory bound to `logResolver`.
 *
 * Calling the returned function uses the resolver's default transport, while
 * `use()` selects a specific one.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 * @param logResolver - Resolver used to select the log that opens the span.
 * @returns A {@link WithLogSpan} that is also a
 *          {@link WithLogSpanResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export function withLogSpanFactory<TTransports extends string = string>(
    logResolver: ILogResolver<TTransports>,
): WithLogSpan & WithLogSpanResolver<TTransports> {
    const withLogSpanResolver: WithLogSpanResolver<TTransports>["use"] = (
        transportName,
    ) => {
        return (name) => {
            return ({ next }) => {
                return logResolver.use(transportName).run(next, {
                    span: name,
                });
            };
        };
    };

    const middleware = withLogSpanResolver() as WithLogSpan &
        WithLogSpanResolver<TTransports>;
    middleware.use = withLogSpanResolver;
    return middleware;
}
