/**
 * @module HttpRouter
 */

import type { HttpErrorStatus } from "@/http-router/contracts/http-status.js";

/**
 * Settings for creating an {@link HttpError}.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Errors
 */
export type HttpErrorSettings = {
    /** The HTTP error status code (4xx or 5xx). */
    status: HttpErrorStatus;

    /** A human-readable error message. */
    message: string;

    /**
     * Arbitrary data to attach to the error (e.g. validation issues).
     */
    details?: unknown;

    /**
     * Headers to set on the HTTP response when the router serializes the error
     * (e.g. `{ "Retry-After": "30" }`).
     */
    headers?: Partial<Record<string, string>>;

    /** The underlying error cause, if any. */
    cause?: unknown;
};

/**
 * Represents an HTTP error with a typed status code.
 *
 * Use the static {@link HttpError.create} factory method to instantiate.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Errors
 */
export class HttpError extends Error {
    /**
     * Creates a new `HttpError` from the given settings.
     *
     * @param settings - The error configuration (status, message, payload, headers, cause).
     */
    static create(settings: HttpErrorSettings): HttpError {
        return new HttpError(settings);
    }

    /**
     * Headers set on the HTTP response when the router serializes the error.
     */
    public readonly headers: Partial<Record<string, string>>;

    /**
     * Arbitrary data attached to the error (e.g. validation issues).
     */
    public readonly details: unknown;

    /**
     * The HTTP error status code (4xx or 5xx).
     */
    public readonly status: HttpErrorStatus;

    /**
     * Note: Do not instantiate `HttpError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(settings: HttpErrorSettings) {
        const { status, message, details, headers = {}, cause } = settings;

        super(message, { cause });

        this.headers = headers;
        this.details = details;
        this.name = HttpError.name;
        this.status = status;
    }
}
