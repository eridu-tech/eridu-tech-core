/**
 * @module Secret
 */

import { secret } from "@/secret/implementations/secret.js";

import type { ISecret } from "@/secret/contracts/_module-export.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module-exports.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * Serialized form of a secret, holding the raw value plus a format version.
 *
 * @template TValue - Type of the wrapped value.
 *
 * IMPORT_PATH: `"eridu-tech/secret"`
 * @group Implementations
 */
export type SerializedSecret<TValue = unknown> = {
    version: "1";
    value: TValue;
};

/**
 * Serde transformer for secrets, keeping secret values intact across a
 * serialization round-trip.
 *
 * Serializing unwraps the secret to its raw value; deserializing wraps the
 * value back into a secret.
 *
 * @template TValue - Type of the wrapped value.
 *
 * IMPORT_PATH: `"eridu-tech/secret"`
 * @group Implementations
 */
export class SecretSerdeTransformer<TValue> implements ISerdeTransformer<
    ISecret<TValue>,
    SerializedSecret<TValue>
> {
    /**
     * Name(s) identifying this transformer in serialized output.
     */
    get name(): OneOrMore<string> {
        return "secret";
    }

    /**
     * Checks whether a value is a secret.
     *
     * Secret-shaped objects are matched structurally, so secrets created
     * anywhere (not only by `secret()`) are recognized.
     *
     * @param value - The value to check.
     * @returns `true` when `value` exposes both `toString()` and `get()`.
     */
    isApplicable(value: unknown): value is ISecret<TValue> {
        return (
            typeof value === "object" &&
            value !== null &&
            "toString" in value &&
            typeof value.toString === "function" &&
            "get" in value &&
            typeof value.get === "function"
        );
    }

    /**
     * Rebuilds a secret from its serialized form.
     *
     * @param serializedValue - The serialized secret.
     * @returns A secret wrapping the stored value.
     */
    deserialize(serializedValue: SerializedSecret<TValue>): ISecret<TValue> {
        return secret(serializedValue.value);
    }

    /**
     * Extracts the raw value from a secret.
     *
     * @param deserializedValue - The secret to serialize.
     * @returns The serialized secret, including the format version.
     */
    serialize(deserializedValue: ISecret<TValue>): SerializedSecret<TValue> {
        return {
            version: "1",
            value: deserializedValue.get(),
        };
    }
}
