/**
 * @module HttpRouter
 */

/**
 * Joins a router prefix with one or more sub-paths into a single absolute
 * route path.
 *
 * Every path is trimmed of the slashes at its edges, and paths that become
 * empty are dropped. The remaining parts are joined with `/` and the result is
 * wrapped with a leading slash, so `("a", "b")` resolves to `"/a/b"` and
 * `("/a/b/", "c")` resolves to `"/a/b/c"`. A trailing slash is never kept,
 * so the result is the exact path a request must use to match the route.
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

    return withoutTrailingSlash(`/${segments.join("/")}/`);
}

/**
 * Removes the trailing slashes from a path so the result can be registered as a
 * route pattern or compared against one. A path that is made only of slashes
 * resolves to the root path, so `"/"`, `"///"` and `""` all resolve to `"/"`.
 */
function withoutTrailingSlash(path: string): string {
    const trimmed = path.replace(/\/+$/g, "");
    return trimmed === "" ? "/" : trimmed;
}
