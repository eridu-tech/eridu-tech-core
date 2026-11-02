/**
 * @module Concurrency
 */

import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Errors
 */
export class AbortConcurrencyError extends Error {
    static create(message: string, cause?: unknown): AbortConcurrencyError {
        return new AbortConcurrencyError(message, cause);
    }

    /**
     * Note: Do not instantiate `AbortConcurrencyError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = AbortConcurrencyError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Errors
 */
export const CONCURRENCY_ERRORS = {
    Abort: AbortConcurrencyError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Errors
 */
export type AllConcurrencyErrors = InferInstance<
    (typeof CONCURRENCY_ERRORS)[keyof typeof CONCURRENCY_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/concurrency/contracts"`
 * @group Errors
 */
export function isConcurrency(value: unknown): value is AllConcurrencyErrors {
    for (const errorClass of Object.values(CONCURRENCY_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
