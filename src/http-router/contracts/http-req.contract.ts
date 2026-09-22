/**
 * @module HttpRouter
 */

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type {
    StringInputs,
    RawFormData,
    FileInputs,
    MultiStringInputs,
    CoercibleStringInputs,
    CoercibleMultiStringInputs,
} from "@/http-router/contracts/_shared.js";
import type { IHttpFileCollection } from "@/http-router/contracts/http-file-collection.contract.js";
import type { StrIntellisense } from "@/utilities/_module.js";

/**
 * Represents the HTTP request method: common verbs autocomplete, any string is
 * accepted.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpMethod = StrIntellisense<
    | "GET"
    | "DELETE"
    | "POST"
    | "PUT"
    | "HEAD"
    | "PATCH"
    | "OPTIONS"
    | "TRACE"
    | "CONNECT"
>;

/**
 * A record of validated file field names to their
 * {@link IHttpFileCollection} instances, produced by
 * {@link IHttpReq.files | files()}.
 *
 * @typeParam TReqFiles - The file definitions used for validation.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type HttpReqFiles<TReqFiles extends FileInputs = FileInputs> = {
    [K in keyof TReqFiles]: IHttpFileCollection;
};

/**
 * Represents an incoming HTTP request with typed access to all request data.
 *
 * Every data source — body, form fields, files, path params, query params,
 * headers, and cookies — can be read raw, or validated by passing a
 * {@link https://standardschema.dev | Standard Schema} to the method, which
 * then returns the validated value.
 *
 * Also async-iterates the raw body chunks.
 *
 * IMPORT_PATH: `"eridu-tech/http-router/contracts"`
 * @group Contracts
 */
export type IHttpReq = AsyncIterable<unknown> & {
    /**
     * Aborts when the client disconnects or the request times out. Listen to it
     * to stop long-running work early.
     */
    readonly signal: AbortSignal;

    /**
     * The HTTP method of the request (e.g. `GET`).
     */
    readonly method: HttpMethod;

    /**
     * The full request URL.
     */
    readonly url: string;

    /**
     * Returns the request cookies as a record of cookie name to value.
     */
    cookies(): StringInputs;
    /**
     * Returns the cookies validated by the given schema.
     *
     * @param schema - The schema used to validate the cookies.
     */
    cookies<TCookies extends CoercibleStringInputs>(
        schema: StandardSchemaV1<StringInputs, TCookies>,
    ): TCookies;

    /**
     * Parses the request body as JSON.
     */
    json(): Promise<unknown>;
    /**
     * Parses the request body and validates it with the given schema.
     *
     * @param schema - The schema used to validate the parsed body.
     */
    json<TJSon>(schema: StandardSchemaV1<unknown, TJSon>): Promise<TJSon>;

    /**
     * Returns the path parameters as a record of parameter name to value.
     */
    params(): StringInputs;
    /**
     * Returns the path parameters validated by the given schema.
     *
     * @param schema - The schema used to validate the path parameters.
     */
    params<TParams extends CoercibleStringInputs>(
        schema: StandardSchemaV1<StringInputs, TParams>,
    ): TParams;

    /**
     * Returns the query parameters, with repeated keys as arrays of strings.
     */
    searchParams(): MultiStringInputs;
    /**
     * Returns the query parameters validated by the given schema.
     *
     * @param schema - The schema used to validate the query parameters.
     */
    searchParams<TSearchParams extends CoercibleMultiStringInputs>(
        schema: StandardSchemaV1<MultiStringInputs, TSearchParams>,
    ): TSearchParams;

    /**
     * Returns the request headers as a record of header name to value.
     */
    headers(): StringInputs;
    /**
     * Returns the request headers validated by the given schema.
     *
     * @param schema - The schema used to validate the headers.
     */
    headers<THeaders extends CoercibleStringInputs>(
        schema: StandardSchemaV1<StringInputs, THeaders>,
    ): THeaders;

    /**
     * Returns the form fields, with repeated field names as arrays of strings.
     */
    fields(): Promise<MultiStringInputs>;
    /**
     * Returns the form fields validated by the given schema.
     *
     * @param schema - The schema used to validate the form fields.
     */
    fields<TFields extends CoercibleMultiStringInputs>(
        schema: StandardSchemaV1<MultiStringInputs, TFields>,
    ): Promise<TFields>;

    /**
     * Returns the uploaded files as an {@link IHttpFileCollection} per field.
     */
    files(): Promise<HttpReqFiles>;
    /**
     * Returns the uploaded files validated against the given definitions as a
     * typed {@link HttpReqFiles} record.
     *
     * Every declared field is validated — required unless `optional` is `true`
     * or `min` is `0` — and fields without an upload are omitted from the
     * result.
     *
     * @param schema - The file definitions to validate the uploads with.
     */
    files<TFiles extends FileInputs>(
        schema: TFiles,
    ): Promise<HttpReqFiles<TFiles>>;

    /**
     * Returns the raw unparsed `FormData` as a plain object, or `{}` when the
     * request has no form body. Each field is a `string` or an {@link IHttpFile}.
     */
    formData(): Promise<RawFormData>;

    /**
     * Reads the request body as plain text.
     */
    text(): Promise<string>;

    /**
     * Reads the request body as a `Uint8Array`.
     */
    bytes(): Promise<Uint8Array>;

    /**
     * Reads the request body as an `ArrayBuffer`.
     */
    arrayBuffer(): Promise<ArrayBuffer>;

    /**
     * The request body as a `ReadableStream` for chunked reading, or `null` when
     * there is no body (e.g. `GET`/`HEAD`).
     */
    readonly readableStream: ReadableStream<unknown> | null;

    /**
     * Reads the request body as a `Blob`.
     */
    blob(): Promise<Blob>;

    /**
     * The underlying Web API `Request`, for interop with libraries that expect
     * one, such as [better-auth](https://better-auth.com/).
     */
    readonly webReq: Request;
};
