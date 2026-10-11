/**
 * @module Collection
 */

/**
 * @internal
 */
class RangeIterable implements Iterable<number> {
    constructor(
        private from: number,
        private to: number,
    ) {}

    *[Symbol.iterator](): Iterator<number> {
        for (let i = this.from; i <= this.to; i++) {
            yield i;
        }
    }
}
/**
 * The `range` function return a {@link Iterable | `Iterable`} of numbers, starting from `from`,increments by 1 and stops at `to`.
 *
 * IMPORT_PATH: `"eridu-tech/collection"`
 * @group Utilities
 */
export function range(from: number, to: number): Iterable<number> {
    return new RangeIterable(from, to);
}
