/**
 * @module GenericPool
 */

import { isGenericPool } from "@/generic-pool/implementations/is-generic-pool.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    IGenericPoolBase,
    Poolable,
} from "@/generic-pool/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export function resolvePoolable<TClient>(
    poolable: Poolable<TClient>,
    poolFactory: Invocable<[client: TClient], IGenericPoolBase<TClient>>,
): IGenericPoolBase<TClient> {
    if (isGenericPool(poolable)) {
        return poolable;
    }
    return callInvocable(poolFactory, poolable);
}
