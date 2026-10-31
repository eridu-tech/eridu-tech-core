/**
 * @module Codec
 */

import {
    UnableToEncodeCodecError,
    UnableToDecodeCodecError,
} from "@/codec/contracts/_module-exports.js";

import type { ICodec } from "@/codec/contracts/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/codec/base-64-codec"`
 * @group Implementations
 */
export class Base64Codec implements ICodec<string, string> {
    encode(decodedValue: string): string {
        try {
            return btoa(decodedValue);
        } catch (error: unknown) {
            throw UnableToEncodeCodecError.create(error);
        }
    }

    decode(encodedValue: string): string {
        try {
            return atob(encodedValue);
        } catch (error: unknown) {
            throw UnableToDecodeCodecError.create(error);
        }
    }
}
