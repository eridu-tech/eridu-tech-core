/**
 * @module RateLimiter
 */

import { RateLimiterSerdeTransformer } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter-serde-transformer.js";
import { RateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { NoOpSerde } from "@/serde/implementations/no-op-serde/_module-exports.js";
import {
    CORE,
    resolveOneOrMore,
    resolveSerializationId,
} from "@/utilities/_module-exports.js";

import type {
    IRateLimiter,
    IRateLimiterAdapter,
    IRateLimiterFactory,
    RateLimiterFactoryCreateSettings,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { ISerdeRegister } from "@/serde/contracts/_module-exports.js";
import type {
    ErrorPolicy,
    IInitizable,
    OneOrMore,
} from "@/utilities/_module-exports.js";

/**
 * Base configuration shared by all `RateLimiterFactory` variants.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterFactorySettingsBase = {
    /**
     * Optional prefix used to scope the serde transformer name for this rate limiter.
     * This keeps multiple adapters with the same constructor name distinct.
     *
     * @default
     * ```ts
     * getConstructorName(adapter)
     * ```
     */
    serializationId?: string;

    /**
     * You can set the default `ErrorPolicy`
     *
     * @default
     * ```ts
     * (_error: unknown) => true
     * ```
     */
    defaultErrorPolicy?: ErrorPolicy;

    /**
     * If true will only apply rate limiting when function errors and not when function is called.
     * @default false
     */
    onlyError?: boolean;

    /**
     * You can pass an {@link ISerdeRegister | `ISerderRegister`} instance to the {@link RateLimiterFactory | `RateLimiterFactory`} to register the rate limiter's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { NoOpSerde } from "eridu-tech/serde/no-op-serde";
     *
     * new NoOpSerde()
     * ```
     */
    serde?: OneOrMore<ISerdeRegister>;
};

/**
 * Configuration for `RateLimiterFactory`.
 * Extends {@link RateLimiterFactorySettingsBase | `RateLimiterFactorySettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterFactorySettings = RateLimiterFactorySettingsBase & {
    /**
     * The underlying rate-limiter adapter that handles the actual throttling operations.
     */
    adapter: IRateLimiterAdapter;
};

/**
 * The `RateLimiterFactory` class can be derived from any {@link IRateLimiterAdapter | `IRateLimiterAdapter`}.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export class RateLimiterFactory implements IRateLimiterFactory, IInitizable {
    private readonly adapter: IRateLimiterAdapter;
    private readonly onlyError: boolean;
    private readonly defaultErrorPolicy: ErrorPolicy;
    private readonly serde: OneOrMore<ISerdeRegister>;
    private readonly serializationId: string;

    constructor(settings: RateLimiterFactorySettings) {
        const {
            adapter,
            onlyError = false,
            defaultErrorPolicy = () => true,
            serde = new NoOpSerde(),
            serializationId,
        } = settings;

        this.serializationId = resolveSerializationId(serializationId, adapter);
        this.adapter = adapter;
        this.onlyError = onlyError;
        this.defaultErrorPolicy = defaultErrorPolicy;
        this.serde = serde;
    }

    async init(): Promise<void> {
        const transformer = new RateLimiterSerdeTransformer({
            adapter: this.adapter,
            onlyError: this.onlyError,
            errorPolicy: this.defaultErrorPolicy,
            serializationId: this.serializationId,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
        return Promise.resolve();
    }

    create(
        key: string,
        settings: RateLimiterFactoryCreateSettings,
    ): IRateLimiter {
        const {
            errorPolicy = this.defaultErrorPolicy,
            onlyError = this.onlyError,
            limit,
        } = settings;
        return new RateLimiter({
            limit,
            adapter: this.adapter,
            key,
            errorPolicy,
            onlyError,
            serializationId: this.serializationId,
        });
    }
}
