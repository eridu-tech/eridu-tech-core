/**
 * @module Collection
 */

import { resolveInvocable } from "@/utilities/_module-exports.js";

import type {
    ICollection,
    Tap,
} from "@/collection/contracts/_module-exports.js";

/**
 * @internal
 */
export class TapIterable<TInput> implements Iterable<TInput> {
    constructor(
        private collection: ICollection<TInput>,
        private callback: Tap<ICollection<TInput>>,
    ) {}

    *[Symbol.iterator](): Iterator<TInput> {
        resolveInvocable(this.callback)(this.collection);
        yield* this.collection;
    }
}
