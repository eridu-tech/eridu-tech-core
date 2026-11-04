/**
 * @module Serde
 */

import SuperJson from "superjson";

import {
    UnableToDeserializeSerdeError,
    UnableToSerializeSerdeError,
} from "@/serde/contracts/_module-exports.js";
import { resolveOneOrMoreStr } from "@/utilities/_module-exports.js";

import type {
    IFlexibleSerde,
    ISerdeTransformer,
    SerializedValueBase,
} from "@/serde/contracts/_module-exports.js";

/**
 * Serializes and deserializes values with SuperJSON.
 *
 * Supports standard structured data plus custom transformers for runtime-specific
 * values that need stable serialization across boundaries.
 *
 * @group Serde
 */
export class SuperJsonSerde implements IFlexibleSerde<string> {
    private readonly superJson = new SuperJson();

    serialize<TValue>(value: TValue): string {
        try {
            return this.superJson.stringify(value);
        } catch (error: unknown) {
            throw UnableToSerializeSerdeError.create(error);
        }
    }

    deserialize<TValue>(serializedValue: string): TValue {
        try {
            return this.superJson.parse(serializedValue);
        } catch (error: unknown) {
            throw UnableToDeserializeSerdeError.create(error);
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
                isApplicable(value: any): value is any {
                    return transformer.isApplicable(value);
                },
                serialize(deserializedValue) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    return transformer.serialize(deserializedValue);
                },
                deserialize(serializedValue) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    return transformer.deserialize(serializedValue);
                },
            },
            resolveOneOrMoreStr(transformer.name),
        );

        return this;
    }
}
