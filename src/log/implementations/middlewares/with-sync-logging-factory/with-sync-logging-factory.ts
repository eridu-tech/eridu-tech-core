/**
 * @module Log
 */
import type { ILogResolver } from "@/log/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Settings for {@link WithSyncLogging}.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export type WithSyncLoggingSettings = {
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
 * Synchronous variant of `WithLogging`: creates a middleware that logs the
 * class name, function name, arguments, and return value of the wrapped
 * function.
 *
 * @param settings - Optional class name and failure level configuration.
 *
 * @typeParam TParameters - Arguments of the wrapped function.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export type WithSyncLogging = <TParameters extends Array<unknown>, TReturn>(
    settings?: WithSyncLoggingSettings,
) => MiddlewareFn<TParameters, TReturn>;

/**
 * Resolver-facing API returned by {@link withSyncLoggingFactory}.
 *
 * Calling `use()` returns a {@link WithSyncLogging} bound to the selected
 * transport.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export type WithSyncLoggingResolver<TTransports extends string = string> = {
    /**
     * Selects the transport the returned middleware factory uses.
     *
     * @param transportName - The transport to use. Defaults to the resolver's
     * default transport.
     * @returns A {@link WithSyncLogging} bound to the selected transport.
     */
    use(transportName?: TTransports): WithSyncLogging;
};

/**
 * Creates a `WithSyncLogging` factory bound to `logResolver`.
 *
 * Logs `class:` (when configured), `function:`, `args:`, and `return:` for
 * every call. Failures are logged as `error:`, or `fatal:` when
 * `useFatalLevel` is enabled, and then rethrown untouched.
 *
 * Calling the returned function uses the resolver's default transport, while
 * `use()` selects a specific one.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 * @param logResolver - Resolver used to select the log that writes the
 * entries.
 *
 * @returns A {@link WithSyncLogging} that is also a
 *          {@link WithSyncLoggingResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export function withSyncLoggingFactory<TTransports extends string = string>(
    logResolver: ILogResolver<TTransports>,
): WithSyncLogging & WithSyncLoggingResolver<TTransports> {
    const withSyncLoggingResolver: WithSyncLoggingResolver<TTransports>["use"] =
        (transportName) => {
            return (settings = {}) => {
                const { useFatalLevel = false, className } = settings;

                return ({ next, args, name }) => {
                    const log = logResolver.use(transportName);
                    try {
                        if (className !== undefined) {
                            log.verbose(["class:", className]);
                        }
                        log.verbose(["function:", name]);
                        log.verbose(["args:", args.join(", ")]);
                        const result = next();
                        log.verbose(["return:", result]);
                        return result;
                    } catch (error: unknown) {
                        if (useFatalLevel) {
                            log.fatal(["fatal:"], { error });
                        } else {
                            log.error(["error:"], { error });
                        }
                        throw error;
                    }
                };
            };
        };

    const middleware = withSyncLoggingResolver() as WithSyncLogging &
        WithSyncLoggingResolver<TTransports>;
    middleware.use = withSyncLoggingResolver;
    return middleware;
}
