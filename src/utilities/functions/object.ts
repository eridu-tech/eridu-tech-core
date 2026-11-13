/**
 * @module Utilities
 */

/**
 * @internal
 */
export function objectSize<TObject extends object>(object: TObject): number {
    let size = 0;
    for (const key in object) {
        if (object[key] === undefined) {
            continue;
        }
        size++;
    }
    return size;
}

/**
 * @internal
 */
export function isObjectEmpty<TObject extends object>(obj: TObject): boolean {
    for (const key in obj) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const value = obj[key];
        if (value !== undefined) {
            return false;
        }
    }
    return true;
}

/**
 * @internal
 */
export function removeUndefinedProperties<TObject extends object>(
    object: TObject,
): TObject {
    return Object.fromEntries(
        Object.entries(object).filter(([_key, value]) => value !== undefined),
    ) as TObject;
}
