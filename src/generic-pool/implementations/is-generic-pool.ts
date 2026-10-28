/**
 * @module GenericPool
 */

import type {
    IGenericPoolBase,
    Poolable,
} from "@/generic-pool/contracts/_module-exports.js";

/**
 * @internal
 */
export function isGenericPool<TClient>(
    poolable: Poolable<TClient>,
): poolable is IGenericPoolBase<TClient> {
    return (
        typeof poolable === "object" &&
        poolable !== null &&
        "run" in poolable &&
        typeof poolable.run === "function" &&
        "acquireOrFail" in poolable &&
        typeof poolable.acquireOrFail === "function" &&
        "release" in poolable &&
        typeof poolable.release === "function"
    );
}
