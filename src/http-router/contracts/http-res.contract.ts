/**
 * @module HttpRouter
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { IFileSize } from "@/file-size/contracts/_module.js";
import type {
    HttpResCacheControl,
    HttpResContentDisposition,
    HttpResContentEncoding,
    HttpResContentLanguage,
    HttpResContentRange,
    HttpResContentType,
    HttpResETag,
} from "@/http-router/contracts/http-res-headers.js";
import type { HttpStatus } from "@/http-router/contracts/http-status.js";
import type { ITimeSpan } from "@/time-span/contracts/_module.js";

/**
 * Defines the scope of a cookie — the `Path`, `Secure`, and `Domain` attributes
 * that must match when reading or removing a previously set cookie.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type CookieScope = {
    /**
     * The `Path` attribute that was used when the cookie was set.
     *
     * @default null
     */
    path?: string | null;

    /**
     * The `Secure` attribute that was used when the cookie was set.
     *
     * @default false
     */
    secure?: boolean;

    /**
     * The `Domain` attribute that was used when the cookie was set.
     *
     * @default null
     */
    domain?: string | null;
};

/**
 * Settings for configuring a `Set-Cookie` header.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type CookieSetSettings = CookieScope & {
    /**
     * The `Expires` attribute — a `Date` or an `ITimeSpan` relative to now.
     *
     * @default null — omitted from the cookie
     */
    expires?: Date | ITimeSpan | null;

    /**
     * The `HttpOnly` attribute — when `true`, the cookie is inaccessible to JavaScript.
     *
     * @default false — omitted from the cookie
     */
    httpOnly?: boolean;

    /**
     * The `Max-Age` attribute — lifetime in seconds, as a number or an
     * `ITimeSpan`.
     *
     * @default null — omitted from the cookie
     */
    maxAge?: number | ITimeSpan | null;

    /**
     * The `SameSite` attribute — controls cross-site request behaviour:
     * `"Strict"` (same-site only), `"Lax"` (also top-level navigation GETs),
     * or `"None"` (all requests, requires `Secure`).
     *
     * @default "Lax"
     */
    sameSite?: "Strict" | "Lax" | "None";

    /**
     * The `Priority` attribute — hints to the browser which cookies to evict first.
     *
     * @default null — omitted from the cookie
     */
    priority?: "Low" | "Medium" | "High" | null;

    /**
     * Cookie name prefix enforced by the browser (both reject `Domain`):
     * - `"secure"` — the `__Secure-` prefix, requires `Secure`.
     * - `"host"` — the `__Host-` prefix, requires `Secure` and `Path=/`.
     *
     * @default null — omitted from the cookie
     */
    prefix?: "secure" | "host" | null;

    /**
     * The `Partitioned` attribute — when `true`, the cookie is stored using
     * partitioned storage (CHIPS), scoped to the top-level site.
     *
     * @default false — omitted from the cookie
     */
    partitioned?: boolean;
};

/**
 * Represents an outgoing HTTP response with a builder-style API: every method
 * returns the instance for chaining, and {@link IHttpRes.buildWebRes |
 * buildWebRes} produces the final Web API `Response`.
 *
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type IHttpRes = {
    /**
     * Sets the `Content-Type` header to a well-known media type.
     */
    setContentType(type: HttpResContentType): IHttpRes;

    /**
     * Sets the `Content-Length` header from a number or an `IFileSize`.
     */
    setContentLength(length: number | IFileSize): IHttpRes;

    /**
     * Sets the `Content-Encoding` header (e.g. gzip, br, deflate).
     */
    setContentEncoding(encoding: HttpResContentEncoding): IHttpRes;

    /**
     * Sets the `Content-Language` header to a BCP 47 language tag.
     */
    setContentLanguage(language: HttpResContentLanguage): IHttpRes;

    /**
     * Sets the `Content-Disposition` header (inline or attachment).
     */
    setContentDisposition(disposition: HttpResContentDisposition): IHttpRes;

    /**
     * Sets the `Content-Range` header for partial content responses.
     */
    setContentRange(range: HttpResContentRange): IHttpRes;

    /**
     * Sets the `Cache-Control` header with caching directives.
     */
    setCacheControl(cacheControl: HttpResCacheControl): IHttpRes;

    /**
     * Sets the `ETag` header for conditional response caching.
     */
    setETag(eTag: HttpResETag): IHttpRes;

    /**
     * Sets the `Location` header, typically used for redirects (3xx).
     */
    setLocation(location: string): IHttpRes;

    /**
     * Sets a response header by name and value. Use it for headers that have no
     * dedicated setter.
     *
     * @param key - The header name (e.g. `"X-Custom-Header"`).
     * @param value - The header value.
     */
    setHeader(key: string, value: string): IHttpRes;

    /**
     * Appends a value to a response header instead of replacing it, for headers
     * that allow multiple values (e.g. `Vary`, `Set-Cookie`).
     *
     * @param key - The header name.
     * @param value - The header value to append.
     */
    appendHeader(key: string, value: string): IHttpRes;

    /**
     * Returns the value of a response header, or `null` when it is not set.
     *
     * @param key - The header name.
     */
    getHeader(key: string): string | null;

    /**
     * Sets the status code, as an `HttpStatus` or a number.
     */
    setStatus(status: HttpStatus | number): IHttpRes;

    /**
     * Sets the HTTP response status text (the human-readable reason phrase).
     *
     * @param statusText - The status text (e.g. `"Not Found"`).
     */
    setStatusText(statusText: string): IHttpRes;

    /**
     * Sets the response body as raw bytes without touching the `Content-Type`
     * header. Accepts a string, a binary buffer, or an async iterable of byte
     * chunks for streaming.
     *
     * @param content - The response body content.
     */
    setBody(
        content: string | ArrayBuffer | Uint8Array | AsyncIterable<unknown>,
    ): IHttpRes;

    /**
     * Sets a `Set-Cookie` header for the given cookie, updating an existing
     * header with the same name when there is one.
     *
     * @param name - The cookie name.
     * @param value - The cookie value.
     * @param settings - Optional cookie attributes (expires, httpOnly, etc.).
     */
    putCookie(
        name: string,
        value: string,
        settings?: CookieSetSettings,
    ): IHttpRes;

    /**
     * Expires the cookie with the given name by emitting `Set-Cookie` with
     * `Max-Age=0`, replacing an existing header or appending an expired one.
     *
     * @param name - The cookie name to expire.
     * @param settings - Optional scope (path, secure, domain) of the cookie that
     *   was originally set.
     */
    removeCookie(name: string, settings?: CookieScope): IHttpRes;

    /**
     * Strips the `Set-Cookie` headers, or only the one matching the given name.
     *
     * @param name - Optional cookie name to strip.
     */
    withoutCookies(name?: string): IHttpRes;

    /**
     * Returns `true` when at least one `Set-Cookie` header is present, or when
     * the header with the given name is present.
     *
     * @param name - Optional cookie name to check.
     */
    hasCookies(name?: string): boolean;

    /**
     * Builds the final Web API `Response`.
     *
     * `HttpRouter` calls this automatically, so use it directly only in
     * isolation, such as in tests.
     */
    buildWebRes(): Response;
};

/**
 * Helpers for the response of the current request.
 *
 * Each helper replaces the content of the request's {@link IHttpRes} builder
 * and returns it, so headers, status, and cookies already set through `res` are
 * kept.
 *
 * Available on handler and middleware args via {@link HttpHandlerArgs}, for
 * example `json({ ok: true })` or `redirect("/login")`.
 *
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type IHttpResHelpers = {
    /**
     * Adopts a Web API `Response` into the response builder: copies its status,
     * headers, and body so it can be modified before sending. The original
     * `Response` is not mutated.
     *
     * Useful for integrating with `fetch` responses or libraries that rely on
     * the WinterTC standard (e.g. Better Auth).
     *
     * @param res - The source `Response` object to copy from.
     * @returns The response builder holding the copied response.
     */
    fromWebRes(res: Response): IHttpRes;

    /**
     * Replaces the response with a plain-text body and
     * `Content-Type: text/plain`.
     *
     * @param content - The text content.
     */
    text(content: string): IHttpRes;

    /**
     * Replaces the response with an HTML body and
     * `Content-Type: text/html`.
     *
     * @param content - The HTML content.
     */
    html(content: string): IHttpRes;

    /**
     * Replaces the response with a JSON body and
     * `Content-Type: application/json`.
     *
     * @param content - The data to serialize as JSON.
     * @param schema - An optional {@link https://standardschema.dev | Standard Schema}
     *   to validate the data before serialization. When provided, the data is
     *   validated against the schema and only valid data is serialized.
     *   Omit to skip validation.
     */
    json<TData>(
        content: TData,
        schema?: StandardSchemaV1<unknown, TData>,
    ): IHttpRes;

    /**
     * Replaces the response with a 404 Not Found HTML body and
     * `Content-Type: text/html`.
     */
    notFound(): IHttpRes;

    /**
     * Replaces the response with a temporary redirect (HTTP 302)
     * to the given URL.
     *
     * @param url - The redirect destination.
     */
    redirect(url: string): IHttpRes;

    /**
     * Replaces the response with a permanent redirect (HTTP 301)
     * to the given URL.
     *
     * @param url - The redirect destination.
     */
    permanentRedirect(url: string): IHttpRes;
};
