/**
 * @module Observability
 */
import type { ILoggerResolver } from "@/logger/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Settings for {@link WithLogging}.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type WithLoggingSettings = {
    /**
     * Logged as `"class:"` before the function name when defined.
     */
    className?: string;

    /**
     * Logs failures at the `fatal` level instead of `error`.
     *
     * @default false
     */
    useFatalLevel?: boolean;
};

/**
 * Creates a middleware that logs the class name, function name, arguments, and
 * return value of the wrapped function.
 *
 * @param settings - Optional class name and failure level configuration.
 *
 * @typeParam TParameters - Arguments of the wrapped function.
 * @typeParam TReturn - Resolved return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type WithLogging = <TParameters extends Array<unknown>, TReturn>(
    settings?: WithLoggingSettings,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withLoggingFactory}.
 *
 * Calling `use()` returns a {@link WithLogging} bound to the selected
 * transport.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type WithLoggingResolver<TTransports extends string = string> = {
    /**
     * Selects the transport the returned middleware factory uses.
     *
     * @param transportName - The transport to use. Defaults to the resolver's
     * default transport.
     * @returns A {@link WithLogging} bound to the selected transport.
     */
    use(transportName?: TTransports): WithLogging;
};

/**
 * Creates a `WithLogging` factory bound to `loggerResolver`.
 *
 * Logs `class:` (when configured), `function:`, `args:`, and `return:` for
 * every call. Failures are logged as `error:`, or `fatal:` when
 * `useFatalLevel` is enabled, and then rethrown untouched.
 *
 * Calling the returned function uses the resolver's default transport, while
 * `use()` selects a specific one.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 * @param loggerResolver - Resolver used to select the logger that writes the
 * entries.
 *
 * @returns A {@link WithLogging} that is also a {@link WithLoggingResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export function withLoggingFactory<TTransports extends string = string>(
    loggerResolver: ILoggerResolver<TTransports>,
): WithLogging & WithLoggingResolver<TTransports> {
    const withLoggingResolver: WithLoggingResolver<TTransports>["use"] = (
        transportName,
    ) => {
        return (settings = {}) => {
            const { useFatalLevel = false, className } = settings;
            return async ({ next, args, name }) => {
                const logger = loggerResolver.use(transportName);
                try {
                    if (className !== undefined) {
                        logger.verbose(["class:", className]);
                    }
                    logger.verbose(["function:", name]);
                    logger.verbose(["args:", args.join(", ")]);
                    const result = await next();
                    logger.verbose(["return:", result]);
                    return result;
                } catch (error: unknown) {
                    if (useFatalLevel) {
                        logger.fatal(["fatal:"], { error });
                    } else {
                        logger.error(["error:"], { error });
                    }
                    throw error;
                }
            };
        };
    };

    const middleware = withLoggingResolver() as WithLogging &
        WithLoggingResolver<TTransports>;
    middleware.use = withLoggingResolver;
    return middleware;
}
