/**
 * @module Logger
 */
import { fileURLToPath } from "node:url";

import { callInvocable } from "@/utilities/_module-exports.js";

import type { ILogResolver } from "@/log/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Details passed to the `metadata` callback of
 * {@link WithLoggingSettings}.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type MetadataSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * Name of the wrapped function.
     */
    functionName: string;

    /**
     * Arguments the wrapped function was called with.
     */
    args: TParameters;
};

/**
 * Settings for the middleware created by {@link withMetadataFactory}.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type WithLoggingSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * Logged as the `class` metadata entry.
     */
    className?: string;

    /**
     * Resolves the path logged as the `filePath` metadata entry.
     *
     * @default
     * ```ts
     * () => fileURLToPath(import.meta.url)
     * ```
     */
    getCurrentFilePath?: Invocable<[], string | null>;

    /**
     * Returns extra entries to merge into the metadata. The built-in entries
     * (`filePath`, `class`, `function`) take precedence on collision.
     *
     * @default
     * ```ts
     * () => ({})
     * ```
     */
    metadata?: Invocable<
        [args: MetadataSettings<TParameters>],
        Partial<Record<string, unknown>>
    >;
};

/**
 * Creates a middleware that scopes `filePath`, `class`, and `function`
 * metadata to the wrapped function.
 *
 * @param settings - Optional class name, file path resolver, and metadata
 * factory.
 *
 * @typeParam TParameters - Arguments of the wrapped function.
 * @typeParam TReturn - Resolved return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type WithLogging = <TParameters extends Array<unknown>, TReturn>(
    settings?: WithLoggingSettings<TParameters>,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withMetadataFactory}.
 *
 * Calling `use()` returns a {@link WithLogging} bound to the selected
 * transport.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export type WithMetadataResolver<TTransports extends string = string> = {
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
 * Creates a `WithLogging` factory bound to `logResolver`.
 *
 * The metadata is attached through the selected log's `run`, so it is
 * visible only to entries logged while the wrapped function runs.
 *
 * Calling the returned function uses the resolver's default transport, while
 * `use()` selects a specific one.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 * @param logResolver - Resolver used to select the log that scopes the
 * metadata.
 *
 * @returns A {@link WithLogging} that is also a {@link WithMetadataResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/logger/middlewares"`
 * @group Middlewares
 */
export function withMetadataFactory<TTransports extends string = string>(
    logResolver: ILogResolver<TTransports>,
): WithLogging & WithMetadataResolver<TTransports> {
    const withMetadataResolver: WithMetadataResolver<TTransports>["use"] = (
        transportName,
    ) => {
        return (settings = {}) => {
            const {
                getCurrentFilePath = () => fileURLToPath(import.meta.url),
                metadata = () => ({}),
                className,
            } = settings;
            return async ({ next, name, args }) => {
                const log = logResolver.use(transportName);
                return log.run(next, {
                    metadata: {
                        ...callInvocable(metadata, {
                            args,
                            functionName: name,
                        }),
                        filePath: callInvocable(getCurrentFilePath),
                        class: className,
                        function: name,
                    },
                });
            };
        };
    };

    const middleware = withMetadataResolver() as WithLogging &
        WithMetadataResolver<TTransports>;
    middleware.use = withMetadataResolver;
    return middleware;
}
