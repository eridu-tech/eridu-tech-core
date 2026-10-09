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
export class MongodbCacheAdapterSerde implements ISerde<string | number> {
    constructor(private readonly serde: ISerde<string>) {}

    async serialize<TValue>(value: TValue): Promise<string | number> {
        try {
            if (
                typeof value === "number" &&
                !Number.isNaN(value) &&
                Number.isFinite(value)
            ) {
                return value;
            }
            return await this.serde.serialize(value);
        } catch (error: unknown) {
            throw SerializationSerdeError.create(error);
        }
    }

    async deserialize<TValue>(value: string | number): Promise<TValue> {
        try {
            if (typeof value === "number") {
                return value as TValue;
            }
            return await this.serde.deserialize(value);
        } catch (error: unknown) {
            throw DeserializationSerdeError.create(error);
        }
    }
}
