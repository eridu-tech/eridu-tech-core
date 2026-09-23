/**
 * @module RateLimiter
 */

import { RateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { getConstructorName } from "@/utilities/_module.js";

import type { IRateLimiterAdapter } from "@/rate-limiter/contracts/_module.js";
import type { ISerializedRateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module.js";
import type { ErrorPolicy, OneOrMore, WaitUntil } from "@/utilities/_module.js";

/**
 * @internal
 */
export type RateLimiterSerdeTransformerSettings = {
    adapter: IRateLimiterAdapter;
    errorPolicy: ErrorPolicy;
    onlyError: boolean;
    serdeTransformerName: string;
    waitUntil: WaitUntil;
};

/**
 * @internal
 */
export class RateLimiterSerdeTransformer implements ISerdeTransformer<
    RateLimiter,
    ISerializedRateLimiter
> {
    private readonly adapter: IRateLimiterAdapter;
    private readonly errorPolicy: ErrorPolicy;
    private readonly serdeTransformerName: string;
    private readonly onlyError: boolean;
    private readonly waitUntil: WaitUntil;

    constructor(settings: RateLimiterSerdeTransformerSettings) {
        const {
            adapter,
            serdeTransformerName,
            errorPolicy,
            onlyError,
            waitUntil,
        } = settings;

        this.waitUntil = waitUntil;
        this.onlyError = onlyError;
        this.serdeTransformerName = serdeTransformerName;
        this.adapter = adapter;
        this.errorPolicy = errorPolicy;
        this.serdeTransformerName = serdeTransformerName;
    }

    get name(): OneOrMore<string> {
        return [
            "rateLimiter",
            this.serdeTransformerName,
            getConstructorName(this.adapter),
        ].filter((str) => str !== "");
    }

    isApplicable(value: unknown): value is RateLimiter {
        const isRateLimiter =
            value instanceof RateLimiter &&
            getConstructorName(value) === RateLimiter.name;
        if (!isRateLimiter) {
            return false;
        }

        const isSerdTransformerNameMathcing =
            this.serdeTransformerName ===
            value.internalGetSerdeTransformerName();

        const isAdapterMatching =
            getConstructorName(this.adapter) ===
            getConstructorName(value.internalGetAdapter());

        return isSerdTransformerNameMathcing && isAdapterMatching;
    }

    deserialize(serializedValue: ISerializedRateLimiter): RateLimiter {
        const { key, limit } = serializedValue;

        return new RateLimiter({
            waitUntil: this.waitUntil,
            adapter: this.adapter,
            key,
            limit,
            onlyError: this.onlyError,
            errorPolicy: this.errorPolicy,
            serdeTransformerName: this.serdeTransformerName,
        });
    }

    serialize(deserializedValue: RateLimiter): ISerializedRateLimiter {
        return RateLimiter.internalSerialize(deserializedValue);
    }
}
