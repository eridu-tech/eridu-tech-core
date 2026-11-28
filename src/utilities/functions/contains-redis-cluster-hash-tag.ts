/**
 * @module Utilities
 */

/**
 * Checks whether the key contains a Redis Cluster hash tag, that is a non empty
 * `{...}` part, e.g. `{lock}`. Redis only considers the first such part of a
 * key or channel.
 *
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Utilities
 */
export function containsRedisClusterHashTag(key: string): boolean {
    const open = key.indexOf("{");

    if (open === -1) {
        return false;
    }

    const close = key.indexOf("}", open + 1);

    return close > open + 1;
}
