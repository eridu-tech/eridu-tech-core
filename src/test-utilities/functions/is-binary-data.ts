import type { BinaryData } from "@/test-utilities/functions/binary-data.type.js";

/**
 * @internal
 */
export function isBinaryData(val: unknown): val is BinaryData {
    return (
        val instanceof ArrayBuffer ||
        val instanceof SharedArrayBuffer ||
        ArrayBuffer.isView(val) ||
        (typeof Buffer !== "undefined" && Buffer.isBuffer(val))
    );
}
