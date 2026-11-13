/**
 * @module Log
 */
import { fileURLToPath } from "node:url";

import { callInvocable } from "@/utilities/_module-exports.js";

import type { ILogResolver } from "@/log/contracts/_module-exports.js";
import type { MetadataSettings } from "@/log/implementations/middlewares/with-metadata-factory/with-metadata-factory.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Settings for the middleware created by {@link withSyncMetadataFactory}.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export type WithSyncMetadataSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * Name logged as the `class` metadata entry.
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
 * Synchronous variant of the middleware type created by
 * `withMetadataFactory`: scopes `filePath`, `class`, and `function` metadata to
 * the wrapped function.
 *
 * @param settings - Optional class name, file path resolver, and metadata
 * factory.
 *
 * @typeParam TParameters - Arguments of the wrapped function.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export type WithSyncMetadata = <TParameters extends Array<unknown>, TReturn>(
    settings?: WithSyncMetadataSettings<TParameters>,
) => MiddlewareFn<TParameters, TReturn>;

/**
 * Resolver-facing API returned by {@link withSyncMetadataFactory}.
 *
 * Calling `use()` returns a {@link WithSyncMetadata} bound to the selected
 * transport.
 *
 * @typeParam TTransports - Union type of the registered transport names.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export type WithSyncMetadataResolver<TTransports extends string = string> = {
    /**
     * Selects the transport the returned middleware factory uses.
     *
     * @param transportName - The transport to use. Defaults to the resolver's
     * default transport.
     * @returns A {@link WithSyncMetadata} bound to the selected transport.
     */
    use(transportName?: TTransports): WithSyncMetadata;
};

/**
 * Creates a `WithSyncMetadata` factory bound to `logResolver`.
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
 * @returns A {@link WithSyncMetadata} that is also a
 *          {@link WithSyncMetadataResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/log/middlewares"`
 * @group Middlewares
 */
export function withSyncMetadataFactory<TTransports extends string = string>(
    logResolver: ILogResolver<TTransports>,
): WithSyncMetadata & WithSyncMetadataResolver<TTransports> {
    const withSyncMetadataResolver: WithSyncMetadataResolver<TTransports>["use"] =
        (transportName) => {
            return (settings = {}) => {
                const {
                    getCurrentFilePath = () => fileURLToPath(import.meta.url),
                    metadata = () => ({}),
                    className,
                } = settings;

                return ({ next, name, args }) => {
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

    const middleware = withSyncMetadataResolver() as WithSyncMetadata &
        WithSyncMetadataResolver<TTransports>;
    middleware.use = withSyncMetadataResolver;
    return middleware;
}
