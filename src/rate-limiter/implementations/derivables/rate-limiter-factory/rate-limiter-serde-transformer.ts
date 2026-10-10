/**
 * @module RateLimiter
 */

import {
    RATE_LIMITER_CLASS_TAG,
    RateLimiter,
} from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { isInternalSerdeIdentifiable } from "@/utilities/_module-exports.js";

import type {
    IRateLimiter,
    IRateLimiterAdapter,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { ISerializedRateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module-exports.js";
import type { ErrorPolicy, OneOrMore } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type RateLimiterSerdeTransformerSettings = {
    adapter: IRateLimiterAdapter;
    errorPolicy: ErrorPolicy;
    onlyError: boolean;
    serializationId?: string;
};

/**
 * @internal
 */
export class RateLimiterSerdeTransformer implements ISerdeTransformer<
    IRateLimiter,
    ISerializedRateLimiter
> {
    private readonly adapter: IRateLimiterAdapter;
    private readonly errorPolicy: ErrorPolicy;
    private readonly serializationId: string;
    private readonly onlyError: boolean;

    constructor(settings: RateLimiterSerdeTransformerSettings) {
        const { adapter, serializationId, errorPolicy, onlyError } = settings;

        this.onlyError = onlyError;
        this.serializationId = serializationId ?? "";
        this.adapter = adapter;
        this.errorPolicy = errorPolicy;
    }

    get name(): OneOrMore<string> {
        return ["rateLimiter", this.serializationId].filter(
            (str) => str !== "",
        );
    }
    async isApplicable(value: unknown): Promise<boolean> {
        if (!isInternalSerdeIdentifiable(value)) {
            return false;
        }
        if (value.internalClassTag() !== RATE_LIMITER_CLASS_TAG) {
            return false;
        }

        const isSerlizationIdMathcing =
            this.serializationId === (await value.internalSerializationId());

        return isSerlizationIdMathcing;
    }

    deserialize(serializedValue: ISerializedRateLimiter): RateLimiter {
        const { key, limit } = serializedValue;

        return new RateLimiter({
            adapter: this.adapter,
            key,
            limit,
            onlyError: this.onlyError,
            errorPolicy: this.errorPolicy,
            serializationId: this.serializationId,
        });
    }

    serialize(deserializedValue: RateLimiter): ISerializedRateLimiter {
        return RateLimiter.internalSerialize(deserializedValue);
    }
}
