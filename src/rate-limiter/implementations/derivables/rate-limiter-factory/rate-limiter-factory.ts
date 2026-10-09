/**
 * @module RateLimiter
 */

import { RateLimiterSerdeTransformer } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter-serde-transformer.js";
import { RateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import {
    CORE,
    defaultWaitUntil,
    resolveOneOrMore,
    resolveSerdeTransformerName,
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
    OneOrMore,
    WaitUntil,
} from "@/utilities/_module-exports.js";

/**
 * Base configuration shared by all `RateLimiterFactory` variants.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterFactorySettingsBase = {
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
     * import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
     *
     * new SuperJsonSerde()
     * ```
     */
    serde?: OneOrMore<ISerdeRegister>;

    /**
     * The serde transformer name used to identify rate-limiter serializers and deserializers when there are adapters with the same name.
     *
     * The adapter's constructor name is appended to this value, or used on its own when omitted.
     * @default
     * ```ts
     * getConstructorName(adapter)
     * ```
     */
    serdeTransformerName?: string;

    /**
     * You can pass the `waitUntil` function to handle background promises.
     * This is required when working with environments like Cloudflare Workers or Vercel Functions to ensure tasks complete after the response is sent.
     * @default
     * ```ts
     * import { defaultWaitUntil } from "eridu-tech/utilities"
     * ```
     */
    waitUntil?: WaitUntil;
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
export class RateLimiterFactory implements IRateLimiterFactory {
    private readonly adapter: IRateLimiterAdapter;
    private readonly onlyError: boolean;
    private readonly defaultErrorPolicy: ErrorPolicy;
    private readonly serde: OneOrMore<ISerdeRegister>;
    private readonly serdeTransformerName: string;
    private readonly waitUntil: WaitUntil;

    constructor(settings: RateLimiterFactorySettings) {
        const {
            adapter,
            onlyError = false,
            defaultErrorPolicy = () => true,
            serde = new SuperJsonSerde(),
            serdeTransformerName,
            waitUntil = defaultWaitUntil,
        } = settings;

        this.waitUntil = waitUntil;
        this.serdeTransformerName = resolveSerdeTransformerName(
            serdeTransformerName,
            adapter,
        );
        this.adapter = adapter;
        this.onlyError = onlyError;
        this.defaultErrorPolicy = defaultErrorPolicy;
        this.serde = serde;
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new RateLimiterSerdeTransformer({
            waitUntil: this.waitUntil,
            adapter: this.adapter,
            onlyError: this.onlyError,
            errorPolicy: this.defaultErrorPolicy,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
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
            waitUntil: this.waitUntil,
            adapter: this.adapter,
            key,
            errorPolicy,
            onlyError,
            serdeTransformerName: this.serdeTransformerName,
        });
    }
}
