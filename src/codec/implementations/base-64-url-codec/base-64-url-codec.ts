/**
 * @module Codec
 */

import {
    UnableToEncodeCodecError,
    UnableToDecodeCodecError,
} from "@/codec/contracts/_module-exports.js";

import type { ICodec } from "@/codec/contracts/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/codec/base-64-url-codec"`
 * @group Implementations
 */
export class Base64UrlCodec implements ICodec<string, string> {
    encode(decodedValue: string): string {
        try {
            return Buffer.from(decodedValue).toString("base64url");
        } catch (error: unknown) {
            throw UnableToEncodeCodecError.create(error);
        }
    }

    decode(encodedValue: string): string {
        try {
            return Buffer.from(encodedValue, "base64url").toString("utf8");
        } catch (error: unknown) {
            throw UnableToDecodeCodecError.create(error);
        }
    }
}
