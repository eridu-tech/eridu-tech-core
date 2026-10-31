/**
 * @module Serde
 */

/**
 * The error occurs when a value is unable to be serialized.
 *
 * IMPORT_PATH: `"eridu-tech/serde/contracts"`
 * @group Errors
 */
export class UnableToSerializeSerdeError extends Error {
    static create(error: unknown): UnableToSerializeSerdeError {
        return new UnableToSerializeSerdeError(
            `Serialization error "${String(error)}" occurred`,
            error,
        );
    }

    /**
     * Note: Do not instantiate `UnableToSerializeSerdeError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToSerializeSerdeError.name;
    }
}

/**
 * The error occurs when a value is unable to be deserialized.
 *
 * IMPORT_PATH: `"eridu-tech/serde/contracts"`
 * @group Errors
 */
export class UnableToDeserializeSerdeError extends Error {
    static create(error: unknown): UnableToDeserializeSerdeError {
        return new UnableToDeserializeSerdeError(
            `Deserialization error "${String(error)}" occurred`,
            error,
        );
    }

    /**
     * Note: Do not instantiate `UnableToDeserializeSerdeError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToDeserializeSerdeError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/serde/contracts"`
 * @group Errors
 */
export const SERDE_ERRORS = {
    UnableToSerialize: UnableToSerializeSerdeError,
    UnableToDeserialize: UnableToDeserializeSerdeError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/serde/contracts"`
 * @group Errors
 */
export type AllSerdeErrors =
    UnableToSerializeSerdeError | UnableToDeserializeSerdeError;

/**
 * IMPORT_PATH: `"eridu-tech/serde/contracts"`
 * @group Errors
 */
export function isSerdeError(value: unknown): value is AllSerdeErrors {
    for (const errorClass of Object.values(SERDE_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
