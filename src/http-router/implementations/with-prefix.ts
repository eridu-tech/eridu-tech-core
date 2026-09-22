/**
 * @module HttpRouter
 */

/**
 * Joins a router prefix with one or more sub-paths into a single absolute
 * path.
 *
 * Every path is trimmed of the slashes at its edges, and paths that become
 * empty are dropped. The remaining parts are joined with `/` and the result is
 * wrapped with a leading and a trailing slash, so `("a", "b")` resolves to
 * `"/a/b/"` and `("/a/b/", "c")` resolves to `"/a/b/c/"`.
 *
 * When every path is made only of slashes nothing remains to join, and the
 * function resolves to `"/"`.
 *
 * @internal
 */
export function withPrefix(
    prefix: string,
    subPath: string,
    ...rest: Array<string>
): string {
    const segments = [prefix, subPath, ...rest]
        .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
        .filter((segment) => segment !== "");

    if (segments.length === 0) {
        return "/";
    }

    return `/${segments.join("/")}/`;
}
