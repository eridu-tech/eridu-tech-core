/**
 * @module Codec
 */

import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * The error occurs when a value is unable to be encoded.
 *
 * IMPORT_PATH: `"eridu-tech/codec/contracts"`
 * @group Errors
 */
export class UnableToEncodeCodecError extends Error {
    static create(error: unknown): UnableToEncodeCodecError {
        return new UnableToEncodeCodecError(
            `Encoding error "${String(error)}" occurred`,
            error,
        );
    }

    /**
     * Note: Do not instantiate `UnableToEncodeCodecError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToEncodeCodecError.name;
    }
}

/**
 * The error occurs when a value is unable to be decoded.
 *
 * IMPORT_PATH: `"eridu-tech/codec/contracts"`
 * @group Errors
 */
export class UnableToDecodeCodecError extends Error {
    static create(error: unknown): UnableToDecodeCodecError {
        return new UnableToDecodeCodecError(
            `Decoding error "${String(error)}" occurred`,
            error,
        );
    }

    /**
     * Note: Do not instantiate `UnableToDecodeCodecError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToDecodeCodecError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/codec/contracts"`
 * @group Errors
 */
export const CODEC_ERRORS = {
    UnableToEncode: UnableToEncodeCodecError,
    UnableToDecode: UnableToDecodeCodecError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/codec/contracts"`
 * @group Errors
 */
export type AllCodecErrors = InferInstance<
    (typeof CODEC_ERRORS)[keyof typeof CODEC_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/codec/contracts"`
 * @group Errors
 */
export function isCodecError(value: unknown): value is AllCodecErrors {
    for (const errorClass of Object.values(CODEC_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
