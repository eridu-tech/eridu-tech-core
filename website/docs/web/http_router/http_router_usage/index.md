---
sidebar_position: 1
sidebar_label: Usage
pagination_label: HTTP Router usage
tags:
    - HTTP Router
    - Routing
    - Middleware
    - WinterTC
keywords:
    - HttpRouter
    - Routing
    - Middleware
    - HTTP
    - Winter TC
---

# HTTP Router usage

The `eridu-tech/http-router` component provides a framework-agnostic HTTP router built on top of the [Hono](https://hono.dev/) router engine. It implements the **Winter TC fetch object standard**, which means it exposes a standard `fetch(request): Response` signature. This allows it to be integrated directly into any runtime or framework that supports the Fetch API including Node.js, Bun, Deno, Cloudflare Workers, Next.js, Nuxt, SvelteKit, and more.

The router provides typed path parameters, a middleware chain with shared context, response helpers, cookie management, file upload validation, and schema-based request validation.

## Initial configuration

To begin using the `HttpRouter` class, you'll need to create and configure an instance:

```ts file=./samples/http-router-initial-config.ts

```

The `router` setting accepts any Hono-compatible router instance. For most use cases, the pre-configured `SmartRouter` with `RegExpRouter` and `TrieRouter` provides the best balance of performance and feature support.

You can also use the bundled `defaultHttpRouterAdapter`:

```ts file=./samples/default-adapter-http-router-initial-config.ts

```

:::info
Here is a complete list of settings for the [`HttpRouter`](https://eridu-tech.github.io/eridu-tech-core/types/HttpRouter.HttpRouterSettings.html) class.
:::

## HttpRouter basics

### Defining endpoints

#### Basic endpoints

You can register an endpoint using the `endpoint` method with a URL pattern and handler:

```ts file=./samples/basic-endpoint.ts

```

#### HTTP methods

You can specify one or more HTTP methods an endpoint responds to:

```ts file=./samples/http-methods.ts

```

When no `method` is specified, the endpoint responds to **all** HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD, CONNECT, TRACE).

You can also use custom HTTP methods like `PURGE`:

```ts file=./samples/custom-http-method.ts

```

#### Multiple methods

You can register the same handler for multiple methods at once:

```ts file=./samples/multiple-methods.ts

```

#### Path parameters

Define dynamic path segments with `:paramName` syntax. The router automatically extracts path parameters and makes them available via `req.params()`:

```ts file=./samples/path-parameters.ts

```

Multiple path parameters are also supported:

```ts file=./samples/multiple-path-parameters.ts

```

#### Optional parameters

Parameters can be made optional with the `?` suffix. The route matches both with and without the parameter:

```ts file=./samples/optional-parameters.ts

```

#### Wildcard patterns

Use `*` as a wildcard segment to match any value:

```ts file=./samples/wildcard-pattern.ts

```

Deep wildcards match across multiple path segments:

```ts file=./samples/deep-wildcard.ts

```

#### Regex-constrained parameters

You can constrain path parameters with regular expressions:

```ts file=./samples/regex-constrained-parameters.ts

```

You can also use regexp patterns that include slashes:

```ts file=./samples/regex-parameters-with-slashes.ts

```

#### Method matching behaviour

If a request arrives for a path that exists but with a method that is not registered, the router returns a `404 Not Found` response:

```ts file=./samples/method-matching-behaviour.ts

```

### Route grouping

You can group routes under a common prefix using the `group` method:

```ts file=./samples/route-grouping.ts

```

Routes defined inside the group are automatically prefixed. For example, `/users` becomes `/api/users`.

Groups can also be nested without a prefix:

```ts file=./samples/nested-group.ts

```

### Handler arguments

Route handlers receive an object with the following properties:

#### `req` The incoming request

The `req` object provides access to all request data:

```ts file=./samples/handler-req-access.ts

```

#### `res` The response builder

The `res` object allows building the response using a fluent API:

```ts file=./samples/handler-res-builder.ts

```

#### `context`

The `context` object is a shared key-value store that lives for the duration of a single request. It persists across the middleware chain and the final handler, making it ideal for passing data between middleware and handlers:

```ts file=./samples/handler-context.ts

```

### Response helpers

Handler arguments include response helper methods for creating common responses. These are destructured directly from the handler args:

#### text

```ts file=./samples/helper-text.ts

```

#### html

```ts file=./samples/helper-html.ts

```

#### json

```ts file=./samples/helper-json.ts

```

The `json` helper also accepts an optional Standard Schema for runtime validation:

```ts file=./samples/helper-json-with-schema.ts

```

#### notFound

```ts file=./samples/helper-not-found.ts

```

#### redirect

```ts file=./samples/helper-redirect.ts

```

#### permanentRedirect

```ts file=./samples/helper-permanent-redirect.ts

```

### Cookie management

The response builder provides full cookie management through the fluent API.

#### Setting cookies

```ts file=./samples/cookie-set.ts

```

Cookie settings include:

- `expires` Absolute `Date` or relative `ITimeSpan`
- `maxAge` Lifetime in seconds (number or `ITimeSpan`)
- `httpOnly` Restrict access to HTTP-only
- `secure` Only send over HTTPS
- `sameSite` `"Strict"`, `"Lax"` (default), or `"None"`
- `domain` The domain scope
- `path` The path scope
- `priority` `"Low"`, `"Medium"`, or `"High"`
- `prefix` `"secure"` (adds `__Secure-`) or `"host"` (adds `__Host-`)
- `partitioned` Enable CHIPS partitioned storage

#### Removing cookies

```ts file=./samples/cookie-remove.ts

```

#### Checking if response has set a cookie

```ts file=./samples/cookie-has.ts

```

#### Stripping cookies from response

You can remove all cookies or a specific cookie from the response:

```ts file=./samples/cookie-strip.ts

```

### Middleware

#### Shared middleware

Use the `use` method to register middleware that applies to **multiple routes** registered on the same router instance:

```ts file=./samples/shared-middleware.ts

```

#### Endpoint-specific middleware

Use the `middlewares` property on an endpoint definition to register middleware that runs **only for that specific endpoint**. This keeps middleware scoped and prevents it from affecting other routes:

```ts file=./samples/endpoint-middleware.ts

```

#### Middleware execution order

Middleware executes in the following order:

1. **Shared middlewares** (from `router.use()`) registered in order
2. **Endpoint-specific middlewares** (from `endpoint.middlewares`) registered in order
3. **Handler** innermost

Each middleware receives a `next` function. Calling `await next()` passes control to the next middleware in the chain. A middleware can short-circuit the chain by returning a response without calling `next()`.

## Patterns

### Handling file uploads

Uploaded files are accessed through the `files()` method, which returns a record mapping each file field name to an `IHttpFileCollection`:

```ts file=./samples/file-upload.ts

```

An `IHttpFileCollection` handles zero, one, or many files with the same API:

| Method             | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `size()`           | Returns the number of files in the collection                   |
| `get(index)`       | Returns the file at a 0-based index, or `null` if out of bounds |
| `getOrFail(index)` | Returns the file at a 0-based index, throws a 400 if missing    |
| `first()`          | Returns the first file, or `null` if the collection is empty    |
| `firstOrFail()`    | Returns the first file, throws a 400 if the collection is empty |
| `isEmpty()`        | Returns whether the collection has no files                     |

#### File access methods

| Method               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `asText()`           | Reads the file content as a UTF-8 string             |
| `asBytes()`          | Reads the file content as `Uint8Array`               |
| `asArrayBuffer()`    | Reads the file content as `ArrayBuffer`              |
| `asReadableStream()` | Returns a `ReadableStream<Uint8Array>` for streaming |
| `asFile()`           | Returns the underlying Web API `File` object         |

#### File properties

| Property       | Type       | Description                                 |
| -------------- | ---------- | ------------------------------------------- |
| `name`         | `string`   | The original file name                      |
| `contentType`  | `string`   | The MIME type                               |
| `lastModified` | `Date`     | The last modified timestamp                 |
| `fileSize`     | `FileSize` | The file size (from `eridu-tech/file-size`) |

### Validating request data

You can enforce runtime and compile-time type safety by passing [Standard Schema](https://standardschema.dev/) schemas directly to the request methods.

#### Validating cookies, params, and headers

The `cookies()`, `params()`, and `headers()` methods return a record of string values and accept a schema synchronously:

```ts file=./samples/validate-cookies-params-headers.ts

```

#### Validating search params and fields

The `searchParams()` and `fields()` methods return a record where each value can be a single string or an array of strings, and accept a schema for validation:

```ts file=./samples/validate-search-params-fields.ts

```

#### Validating the JSON body

The `json()` method parses the request body and validates it asynchronously:

```ts file=./samples/validate-json-body.ts

```

#### Validating uploaded files

You can define file validation rules by passing a record of file definitions directly to `req.files()`. Each file field accepts a `FileDef`, which is the union of a `StaticFileDef` (rules known ahead of time) and a `DynamicFileDef` (a function that inspects the uploaded files at runtime):

```ts file=./samples/validate-uploaded-files.ts

```

:::info
All validation throw an `HttpError` with status code `400` if constraints are not met.
:::

### Error handling

Errors thrown inside handlers or middleware propagate as a generic `500 Internal Server Error` response. To return structured HTTP errors with proper status codes and messages, use the `HttpError` class:

```ts file=./samples/http-error-handling.ts

```

### Testing

You can test the code by creating a standard web `Request` object and passing it to the `fetch` method of the `HttpRouter` class:

```ts file=./samples/testing-basic.ts

```

You can also use `HttpReq.test()` to easily create a standard web `Request`:

```ts file=./samples/testing-http-req-test.ts

```

#### `TestReqJsonBody`

Simulates an `application/json` payload:

```ts file=./samples/testing-json-body.ts

```

#### `TestReqUrlEncodedBody`

Simulates an `application/x-www-form-urlencoded` form:

```ts file=./samples/testing-url-encoded-body.ts

```

#### `TestReqMultipartFormDataBody`

Simulates a `multipart/form-data` payload with optional text fields and file uploads:

```ts file=./samples/testing-multipart-body.ts

```

#### `TestReqCustom`

Passes `data` through as-is for arbitrary payloads:

```ts file=./samples/testing-custom-body.ts

```

### Using the context for request-scoped data

The shared `context` object is useful for passing data between middleware and handlers:

```ts file=./samples/request-scoped-context.ts

```

### Using invocable objects as handlers and middleware

Both handlers and middleware can be invocable objects (classes with an `invoke` method), which allows them to encapsulate state. This pattern is designed for seamless integration with dependency injection libraries, as most DI frameworks have first-class support for classes.

**Handler example** using `IHttpHandlerObject`:

```ts file=./samples/invocable-handler.ts

```

**Middleware example** using `IHttpMiddlewareObject`:

```ts file=./samples/invocable-middleware.ts

```

:::info
For further information about invocable objects, refer to the [`Invocable`](/docs/utilities/invocable/) documentation.
:::

### Interoperability with Winter TC standard web request handlers

A Winter TC handler is a function with the signature `(request: Request) => Promise<Response> | Response`. Since `HttpRouter` endpoints expect the richer `HttpHandlerArgs` interface, you can use the `HttpRouter.fromWinterTcHandler()` static method to bridge the two seamlessly:

```ts file=./samples/winter-tc-handler.ts

```

The method internally passes `req.webReq` (the underlying Web API `Request`) to the Winter TC handler and converts the returned `Response` into an `IHttpRes` via `fromWebRes()`.
