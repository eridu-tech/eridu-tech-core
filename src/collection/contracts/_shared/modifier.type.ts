/**
 * @module Collection
 */

import type { Invocable, Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type Modifier<TInput, TOutput> = Invocable<
    [collection: TInput],
    TOutput
>;

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type AsyncModifier<TInput, TOutput> = Invocable<
    [collection: TInput],
    Promisable<TOutput>
>;
