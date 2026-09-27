/**
 * @module BackoffPolicy
 */

import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/backoff-policies/contracts"`
 * @group Contracts
 */
export type BackoffPolicy = Invocable<
    [attempt: number, error: unknown],
    ITimeSpan
>;
