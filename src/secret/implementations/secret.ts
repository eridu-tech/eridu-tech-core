/**
 * @module Secret
 */

import type { ISecret } from "@/secret/contracts/_module-export.js";

/**
 * Wraps a value in a secret so it can be passed around and logged safely.
 *
 * The returned secret always stringifies to `"[redacted]"`; use `get()` to
 * read the real value.
 *
 * @template TValue - Type of the wrapped value.
 * @param value - The sensitive value to hide.
 * @returns A secret wrapping `value`.
 *
 * IMPORT_PATH: `"eridu-tech/secret"`
 * @group Implementations
 */
export function secret<TValue>(value: TValue): ISecret<TValue> {
    return {
        toString(): string {
            return "[redacted]";
        },
        get(): TValue {
            return value;
        },
    };
}
