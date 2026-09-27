/**
 * @module Collection
 */

import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 */
export type Comparator<TItem> = Invocable<[itemA: TItem, itemB: TItem], number>;
