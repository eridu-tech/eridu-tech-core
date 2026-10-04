/**
 * @module Collection
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type {
    Comparator,
    PredicateInvocable,
    ForEach,
    Map,
    Modifier,
    Tap,
    Transform,
    Reduce,
    CrossJoinResult,
    EnsureMap,
    EnsureRecord,
} from "@/collection/contracts/_shared/_module.js";
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ItemNotFoundCollectionError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    MultipleItemsFoundCollectionError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    EmptyCollectionError,
} from "@/collection/contracts/collection.errors.js";
import type { IterableValue, Lazyable } from "@/utilities/_module-exports.js";

/**
 * Collapses 1 layer of nested array, iterable, or collection types into their element type.
 * If `TValue` is an `Array`, `ArrayLike`, `Iterable`, or `ICollection`, the result is
 * the inner item type. Otherwise `TValue` is returned as-is.
 *
 * @template TValue - The value type to collapse.
 *
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 * @group Contracts
 */
export type Collapse<TValue> = TValue extends string
    ? string
    : TValue extends
            | Array<infer TItem>
            | IterableValue<infer TItem>
            | ICollection<infer TItem>
      ? TItem
      : TValue;

/**
 * Serialized representation of an {@link ICollection | `ICollection`} used for persistence and transport.
 * Stores the collection items as a plain array alongside a schema version field
 * to support future format migrations.
 *
 * @template TInput - The element type of the serialized collection.
 *
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 * @group Contracts
 */
export type SerializedCollection<TInput = unknown> = {
    version: "1";
    items: Array<TInput>;
};

/**
 * The `ICollection` contract offers a fluent and efficient approach to working with {@link Iterable | `Iterable`} objects.
 * `ICollection` is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/collection/contracts"`
 * @group Contracts
 */
export interface ICollection<TInput = unknown> extends Iterable<TInput> {
    /**
     * The `toIterator` method converts the collection to a new iterator.
     */
    toIterator(): Iterator<TInput, void>;

    /**
     * The `entries` returns an ICollection of key, value pairs for every entry in the collection.
     */
    entries(): ICollection<[number, TInput]>;

    /**
     * The `keys` method returns an ICollection of keys in the collection.
     */
    keys(): ICollection<number>;

    /**
     * The `copy` method returns a copy of the collection.
     */
    copy(): ICollection<TInput>;

    /**
     * The `filter` method filters the collection using `predicateFn`, keeping only those items that pass `predicateFn`.
     */
    filter<TOutput extends TInput>(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<TOutput>;

    /**
     * The `validate` method filters all items that matches the `schema` and transforms them afterwards.
     * The `schema` can be any [standard schema](https://standardschema.dev/) compliant object.
     */
    validate<TOutput>(
        schema: StandardSchemaV1<TInput, TOutput>,
    ): ICollection<TOutput>;

    /**
     * The `reject` method filters the collection using `predicateFn`, keeping only those items that not pass `predicateFn`.
     */
    reject<TOutput extends TInput>(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<Exclude<TInput, TOutput>>;

    /**
     * The `map` method iterates through the collection and passes each item to `mapFn`.
     * The `mapFn` is free to modify the item and return it, thus forming a new collection of modified items.
     */
    map<TOutput>(
        mapFn: Map<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<TOutput>;

    /**
     * The `reduce` method executes ` reduceFn ` function on each item of the array, passing in the return value from the calculation on the preceding item.
     * The final result of running the reducer across all items of the array is a single value.
     */
    reduce(reduceFn: Reduce<TInput, ICollection<TInput>, TInput>): TInput;
    reduce(
        reduceFn: Reduce<TInput, ICollection<TInput>, TInput>,
        // eslint-disable-next-line @typescript-eslint/unified-signatures
        initialValue: TInput,
    ): TInput;
    reduce<TOutput>(
        reduceFn: Reduce<TInput, ICollection<TInput>, TOutput>,
        initialValue: TOutput,
    ): TOutput;

    /**
     * The `join` method joins the collection's items with ` separator `. An error will be thrown when if a none string item is encounterd.
     * @throws {TypeError}
     * ```ts
     * import type { ICollection } from "eridu-tech/collection/contracts";
     *
     * // Assume the inputed collection is empty.
     * function main(collection: ICollection<number>): void {
     *   collection
     *     .append([1, 2, 3, 4])
     *     .map(item => item.toString())
     *     .join("_");
     *   // "1_2_3_4"
     * }
     * ```
     */
    join(separator?: string): Extract<TInput, string>;

    /**
     * The `collapse` method collapses a collection of iterables into a single, flat collection.
     */
    collapse(): ICollection<Collapse<TInput>>;

    /**
     * The `flatMap` method returns a new array formed by applying `mapFn` to each item of the array, and then collapses the result by one level.
     * It is identical to a `map` method followed by a `collapse` method.
     */
    flatMap<TOutput>(
        mapFn: Map<TInput, ICollection<TInput>, IterableValue<TOutput>>,
    ): ICollection<TOutput>;

    /**
     * The `change` method changes only the items that passes `predicateFn` using `mapFn`.
     */
    change<TFilterOutput extends TInput, TMapOutput>(
        predicateFn: PredicateInvocable<
            TInput,
            ICollection<TInput>,
            TFilterOutput
        >,
        mapFn: Map<TFilterOutput, ICollection<TInput>, TMapOutput>,
    ): ICollection<TInput | TFilterOutput | TMapOutput>;

    /**
     * The `set` method changes a item by i>index` using `value`.
     */
    set(
        index: number,
        value: TInput | Map<TInput, ICollection<TInput>, TInput>,
    ): ICollection<TInput>;

    /**
     * The `get` method returns the item by index. If the item is not found null will returned.
     */
    get(index: number): TInput | null;

    /**
     * The `getOr` method returns the item by index. If the item is not found null will returned.
     */
    getOr<TExtended = TInput>(
        index: number,
        defaultValue: Lazyable<TExtended>,
    ): TInput | TExtended;

    /**
     * The `getOrFail` method returns the item by index. If the item is not found an error will be thrown.
     * @throws {ItemNotFoundCollectionError}
     */
    getOrFail(index: number): TInput;

    /**
     * The `page` method returns a new collection containing the items that would be present on ` page ` with custom ` pageSize `.
     */
    page(page: number, pageSize: number): ICollection<TInput>;

    /**
     * The `sum` method returns the sum of all items in the collection. If the collection includes other than number items an error will be thrown.
     * If the collection is empty an error will also be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     */
    sum(): Extract<TInput, number>;

    /**
     * The `average` method returns the average of all items in the collection. If the collection includes other than number items an error will be thrown.
     * If the collection is empty an error will also be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     */
    average(): Extract<TInput, number>;

    /**
     * The `median` method returns the median of all items in the collection. If the collection includes other than number items an error will be thrown.
     * If the collection is empty an error will also be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     */
    median(): Extract<TInput, number>;

    /**
     * The `min` method returns the min of all items in the collection. If the collection includes other than number items an error will be thrown.
     * If the collection is empty an error will also be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     */
    min(): Extract<TInput, number>;

    /**
     * The `max` method returns the max of all items in the collection. If the collection includes other than number items an error will be thrown.
     * If the collection is empty an error will also be thrown.
     * @throws {TypeError}
     * @throws {EmptyCollectionError}
     */
    max(): Extract<TInput, number>;

    /**
     * The `percentage` method may be used to quickly determine the percentage of items in the collection that pass `predicateFn`.
     * If the collection is empty an error will also be thrown.
     * @throws {EmptyCollectionError}
     */
    percentage(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): number;

    /**
     * The `some` method determines whether at least one item in the collection matches `predicateFn`.
     */
    some<TOutput extends TInput>(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): boolean;

    /**
     * The `every` method determines whether all items in the collection matches `predicateFn`.
     */
    every<TOutput extends TInput>(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): boolean;

    /**
     * The `take` method takes the first `limit` items.
     */
    take(limit: number): ICollection<TInput>;

    /**
     * The `takeUntil` method takes items until `predicateFn` returns true.
     */
    takeUntil(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): ICollection<TInput>;

    /**
     * The `takeWhile` method takes items until `predicateFn` returns false.
     */
    takeWhile(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): ICollection<TInput>;

    /**
     * The `skip` method skips the first `offset` items.
     */
    skip(offset: number): ICollection<TInput>;

    /**
     * The `skipUntil` method skips items until `predicateFn` returns true.
     */
    skipUntil(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): ICollection<TInput>;

    /**
     * The `skipWhile` method skips items until `predicateFn` returns false.
     */
    skipWhile(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): ICollection<TInput>;

    /**
     * The `when` method will execute `callback` when `condition` evaluates to true.
     */
    when<TExtended = TInput>(
        condition: boolean,
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `whenEmpty` method will execute `callback` when the collection is empty.
     */
    whenEmpty<TExtended = TInput>(
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `whenNot` method will execute `callback` when `condition` evaluates to false.
     */
    whenNot<TExtended = TInput>(
        condition: boolean,
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `whenNotEmpty` method will execute `callback` when the collection is not empty.
     */
    whenNotEmpty<TExtended = TInput>(
        callback: Modifier<ICollection<TInput>, ICollection<TExtended>>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `pipe` method passes the orignal collection to `callback` and returns the result from `callback`.
     * This method is useful when you want compose multiple smaller functions.
     */
    pipe<TOutput = TInput>(
        callback: Transform<ICollection<TInput>, TOutput>,
    ): TOutput;

    /**
     * The `tap` method passes a copy of the original collection to `callback`, allowing you to do something with the items while not affecting the original collection.
     */
    tap(callback: Tap<ICollection<TInput>>): ICollection<TInput>;

    /**
     * The `chunk` method breaks the collection into multiple, smaller collections of size `chunkSize`.
     * If `chunkSize` is not divisible with total number of items then the last chunk will contain the remaining items.
     */
    chunk(chunkSize: number): ICollection<ICollection<TInput>>;

    /**
     * The `chunkWhile` method breaks the collection into multiple, smaller collections based on the evaluation of `predicateFn`.
     * The chunk variable passed to the `predicateFn` may be used to inspect the previous item.
     */
    chunkWhile(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): ICollection<ICollection<TInput>>;

    /**
     * The `split` method breaks a collection evenly into `chunkAmount` of chunks.
     */
    split(chunkAmount: number): ICollection<ICollection<TInput>>;

    /**
     * The `partition` method is used to separate items that pass `predicateFn` from those that do not.
     */
    partition(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): ICollection<ICollection<TInput>>;

    /**
     * The `sliding` method returns a new collection of chunks representing a "sliding window" view of the items in the collection.
     */
    sliding(chunkSize: number, step?: number): ICollection<ICollection<TInput>>;

    /**
     * The `groupBy` method groups the collection's items by ` selectFn `.
     * By default the equality check occurs on the item.
     */
    groupBy<TOutput = TInput>(
        selectFn?: Map<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<[TOutput, ICollection<TInput>]>;

    /**
     * The `countBy` method counts the occurrences of values in the collection by ` selectFn `.
     * By default the equality check occurs on the item.
     */
    countBy<TOutput = TInput>(
        selectFn?: Map<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<[TOutput, number]>;

    /**
     * The `unique` method removes all duplicate values from the collection by ` selectFn `.
     * By default the equality check occurs on the item.
     */
    unique<TOutput = TInput>(
        selectFn?: Map<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<TInput>;

    /**
     * The `difference` method will return the values in the original collection that are not present in `iterable`.
     * By default the equality check occurs on the item.
     */
    difference<TOutput = TInput>(
        iterable: IterableValue<TInput>,
        selectFn?: Map<TInput, ICollection<TInput>, TOutput>,
    ): ICollection<TInput>;

    /**
     * The `repeat` method will repeat the original collection `amount` times.
     */
    repeat(amount: number): ICollection<TInput>;

    /**
     * The `padStart` method pads this collection with `fillItems` until the resulting collection size reaches `maxLength`.
     * The padding is applied from the start of this collection.
     */
    padStart<TExtended = TInput>(
        maxLength: number,
        fillItems: IterableValue<TExtended>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `padEnd` method pads this collection with `fillItems` until the resulting collection size reaches `maxLength`.
     * The padding is applied from the end of this collection.
     */
    padEnd<TExtended = TInput>(
        maxLength: number,
        fillItems: IterableValue<TExtended>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `slice` method creates porition of the original collection selected from `start` and `end`
     * where `start` and `end` (end not included) represent the index of items in the collection.
     */
    slice(start?: number, end?: number): ICollection<TInput>;

    /**
     * The `prepend` method adds `iterable` to the beginning of the collection.
     */
    prepend<TExtended = TInput>(
        iterable: IterableValue<TInput | TExtended>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `append` method adds `iterable` to the end of the collection.
     */
    append<TExtended = TInput>(
        iterable: IterableValue<TInput | TExtended>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `insertBefore` method adds `iterable` before the first item that matches `predicateFn`.
     */
    insertBefore<TExtended = TInput>(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
        iterable: IterableValue<TInput | TExtended>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `insertAfter` method adds `iterable` after the first item that matches `predicateFn`.
     */
    insertAfter<TExtended = TInput>(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
        iterable: IterableValue<TInput | TExtended>,
    ): ICollection<TInput | TExtended>;

    /**
     * The `crossJoin` method cross joins the collection's values among `iterables`, returning a Cartesian product with all possible permutations.
     */
    crossJoin<TExtended>(
        iterable: IterableValue<TExtended>,
    ): ICollection<CrossJoinResult<TInput, TExtended>>;

    /**
     * The `zip` method merges together the values of `iterable` with the values of the collection at their corresponding index.
     * The returned collection has size of the shortest collection.
     */
    zip<TExtended>(
        iterable: IterableValue<TExtended>,
    ): ICollection<[TInput, TExtended]>;

    /**
     * The `sort` method sorts the collection. You can provide a `comparator` function.
     */
    sort(comparator?: Comparator<TInput>): ICollection<TInput>;

    /**
     * The `reverse` method will reverse the order of the collection.
     * The reversing of the collection will be applied in chunks that are the size of ` chunkSize `.
     */
    reverse(chunkSize?: number): ICollection<TInput>;

    /**
     * The `shuffle` method randomly shuffles the items in the collection. You can provide a custom Math.random function by passing in `mathRandom`.
     */
    shuffle(mathRandom?: () => number): ICollection<TInput>;

    /**
     * The `first` method returns the first item in the collection that passes ` predicateFn `.
     * By default it will get the first item. If the collection is empty or no items passes ` predicateFn ` than null i returned.
     * // 3
     */
    first<TOutput extends TInput>(
        predicateFn?: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null;

    /**
     * The `firstOr` method returns the first item in the collection that passes ` predicateFn `
     * By default it will get the first item. If the collection is empty or no items passes ` predicateFn ` than ` defaultValue `.
     */
    firstOr<TOutput extends TInput, TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        predicateFn?: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | TExtended;

    /**
     * The `firstOrFail` method returns the first item in the collection that passes ` predicateFn `.
     * By default it will get the first item. If the collection is empty or no items passes ` predicateFn ` than error is thrown.
     * @throws {ItemNotFoundCollectionError}
     */
    firstOrFail<TOutput extends TInput>(
        predicateFn?: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput;

    /**
     * The `last` method returns the last item in the collection that passes ` predicateFn `.
     * By default it will get the last item. If the collection is empty or no items passes ` predicateFn ` than null i returned.
     */
    last<TOutput extends TInput>(
        predicateFn?: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | null;

    /**
     * The `lastOr` method returns the last item in the collection that passes ` predicateFn `.
     * By default it will get the last item. If the collection is empty or no items passes ` predicateFn ` than ` defaultValue `.
     */
    lastOr<TOutput extends TInput, TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        predicateFn?: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput | TExtended;

    /**
     * The `lastOrFail` method returns the last item in the collection that passes ` predicateFn `.
     * By default it will get the last item. If the collection is empty or no items passes ` predicateFn ` than error is thrown.
     * @throws {ItemNotFoundCollectionError}
     */
    lastOrFail<TOutput extends TInput>(
        predicateFn?: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput;

    /**
     * The `before` method returns the item that comes before the first item that matches `predicateFn`.
     * If the `predicateFn` does not match or matches the first item then null is returned.
     */
    before(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): TInput | null;

    /**
     * The `beforeOr` method returns the item that comes before the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the first item then `defaultValue` is returned.
     */
    beforeOr<TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): TInput | TExtended;

    /**
     * The `beforeOrFail` method returns the item that comes before the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the first item then an error is thrown.
     * @throws {ItemNotFoundCollectionError}
     */
    beforeOrFail(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): TInput;

    /**
     * The `after` method returns the item that comes after the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the last item then null is returned.
     */
    after(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): TInput | null;

    /**
     * The `afterOr` method returns the item that comes after the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the last item then `defaultValue` is returned.
     */
    afterOr<TExtended = TInput>(
        defaultValue: Lazyable<TExtended>,
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): TInput | TExtended;

    /**
     * The `afterOrFail` method returns the item that comes after the first item that matches `predicateFn`.
     * If the collection is empty or the `predicateFn` does not match or matches the last item then an error is thrown.
     * @throws {ItemNotFoundCollectionError}
     */
    afterOrFail(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): TInput;

    /**
     * The `sole` method returns the first item in the collection that passes `predicateFn`, but only if `predicateFn` matches exactly one item.
     * If no items matches or multiple items are found an error will be thrown.
     * @throws {ItemNotFoundCollectionError}
     * @throws {MultipleItemsFoundCollectionError}
     */
    sole<TOutput extends TInput>(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>, TOutput>,
    ): TOutput;

    /**
     * The `nth` method creates a new collection consisting of every n-th item.
     */
    nth(step: number): ICollection<TInput>;

    /**
     * The `count` method returns the total number of items in the collection that passes `predicateFn`.
     */
    count(predicateFn: PredicateInvocable<TInput, ICollection<TInput>>): number;

    /**
     * The `size` returns the size of the collection.
     */
    size(): number;

    /**
     * The `isEmpty` returns true if the collection is empty.
     */
    isEmpty(): boolean;

    /**
     * The `isNotEmpty` returns true if the collection is not empty.
     */
    isNotEmpty(): boolean;

    /**
     * The `searchFirst` return the index of the first item that matches `predicateFn`.
     */
    searchFirst(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): number;

    /**
     * The `searchLast` return the index of the last item that matches `predicateFn`.
     */
    searchLast(
        predicateFn: PredicateInvocable<TInput, ICollection<TInput>>,
    ): number;

    /**
     * The `forEach` method iterates through all items in the collection.
     */
    forEach(callback: ForEach<TInput, ICollection<TInput>>): void;

    /**
     * The `toArray` method converts the collection to a new {@link Array | `Array`}.
     */
    toArray(): Array<TInput>;

    /**
     * The `toRecord` method converts the collection to a new {@link Record | `Record`}.
     * An error will be thrown if item is not a tuple of size 2 where the first element is a string or a number.
     * @throws {TypeError}
     */
    toRecord(): EnsureRecord<TInput>;

    /**
     * The `toMap` method converts the collection to a new {@link Map | `Map`}.
     * An error will be thrown if item is not a tuple of size 2.
     * @throws {TypeError}
     */
    toMap(): EnsureMap<TInput>;
}
