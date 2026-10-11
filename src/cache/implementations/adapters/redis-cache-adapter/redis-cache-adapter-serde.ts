/**
 * @module Serde
 */
import {
    DeserializationSerdeError,
    SerializationSerdeError,
} from "@/serde/contracts/_module-exports.js";

import type { ISerde } from "@/serde/contracts/_module-exports.js";

/**
 * @internal
 */
export class RedisCacheAdapterSerde implements ISerde<string> {
    constructor(private readonly serde: ISerde<string>) {}

    async serialize<TValue>(value: TValue): Promise<string> {
        try {
            if (
                typeof value === "number" &&
                !Number.isNaN(value) &&
                isFinite(value)
            ) {
                return String(value);
            }
            return await this.serde.serialize(value);
        } catch (error: unknown) {
            throw SerializationSerdeError.create(error);
        }
    }

    async deserialize<TValue>(value: string): Promise<TValue> {
        try {
            const isNumberRegex = /^(-?([0-9]+)(\.[0-5]+)?)$/g;
            if (isNumberRegex.test(value)) {
                return Number(value) as TValue;
            }
            return await this.serde.deserialize(value);
        } catch (error: unknown) {
            throw DeserializationSerdeError.create(error);
        }
    }
}
