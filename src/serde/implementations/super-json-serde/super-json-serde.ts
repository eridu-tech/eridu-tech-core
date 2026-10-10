/**
 * @module Serde
 */

import SuperJson from "@eridu-tech/superjson";

import {
    DeserializationSerdeError,
    SerializationSerdeError,
} from "@/serde/contracts/_module-exports.js";
import { resolveOneOrMoreStr } from "@/utilities/_module-exports.js";

import type {
    IFlexibleSerde,
    ISerdeTransformer,
    SerializedValueBase,
} from "@/serde/contracts/_module-exports.js";

/**
 * Serializes and deserializes values with @eridu-tech/superjson,
 * the async-capable fork of SuperJSON.
 *
 * Supports standard structured data plus custom transformers for runtime-specific
 * values that need stable serialization across boundaries.
 *
 * @group Serde
 */
export class SuperJsonSerde implements IFlexibleSerde<string> {
    private readonly superJson = new SuperJson();

    async serialize<TValue>(value: TValue): Promise<string> {
        try {
            return await this.superJson.stringify(value);
        } catch (error: unknown) {
            throw SerializationSerdeError.create(error);
        }
    }

    async deserialize<TValue>(serializedValue: string): Promise<TValue> {
        try {
            return await this.superJson.parse(serializedValue);
        } catch (error: unknown) {
            throw DeserializationSerdeError.create(error);
        }
    }

    registerCustom<
        TCustomDeserialized,
        TCustomSerialized extends SerializedValueBase,
    >(
        transformer: ISerdeTransformer<TCustomDeserialized, TCustomSerialized>,
    ): this {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const customTransformer =
            this.superJson.customTransformerRegistry.findByName(
                resolveOneOrMoreStr(transformer.name),
            ) as any;
        const hasAlreadyCustomTransformer = customTransformer !== undefined;
        if (hasAlreadyCustomTransformer) {
            return this;
        }
        this.superJson.registerCustom<any, any>(
            {
                async isApplicable(value) {
                    return transformer.isApplicable(value);
                },
                async serialize(deserializedValue) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    return transformer.serialize(deserializedValue);
                },
                async deserialize(serializedValue) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    return transformer.deserialize(serializedValue);
                },
            },
            resolveOneOrMoreStr(transformer.name),
        );

        return this;
    }
}
