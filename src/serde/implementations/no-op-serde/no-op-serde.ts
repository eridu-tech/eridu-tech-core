/**
 * @module Serde
 */

import type {
    IFlexibleSerde,
    ISerdeTransformer,
    SerializedValueBase,
} from "@/serde/contracts/_module-exports.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * A serde implementation that returns values unchanged.
 *
 * Useful for tests or environments where serialization is intentionally disabled.
 *
 * @group Serde
 */
export class NoOpSerde<
    TSerializedValue,
> implements IFlexibleSerde<TSerializedValue> {
    serialize<TValue>(value: TValue): Promise<TSerializedValue> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(value as any);
    }

    deserialize<TValue>(serializedValue: TSerializedValue): Promise<TValue> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(serializedValue as any);
    }

    registerCustom<
        TCustomDeserialized,
        TCustomSerialized extends SerializedValueBase,
    >(
        _transformer: ISerdeTransformer<TCustomDeserialized, TCustomSerialized>,
        _prefix?: OneOrMore<string>,
    ): this {
        return this;
    }
}
