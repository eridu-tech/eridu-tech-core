---
sidebar_position: 7
sidebar_label: Middlewares
pagination_label: FileStorage middlewares
tags:
    - FileStorage
    - Middlewares
keywords:
    - FileStorage
    - Middlewares
    - withHttpFileStorageError
---

# FileStorage middlewares

## withHttpFileStorageError middleware {#with_http_file_storage_error_middleware}

The `withHttpFileStorageError` middleware converts every file error thrown by the wrapped endpoint or downstream middleware into an `HttpError`, so the request fails with a meaningful status code instead of a generic `500`. Errors that are not file errors are rethrown untouched, and the original error is preserved as the `cause`.

### Usage

```ts file=./samples/with-http-file-storage-error.ts

```

### Status codes

| Errors                                                                                              | Status |
| --------------------------------------------------------------------------------------------------- | ------ |
| `InvalidKeyFileError`                                                                               | `400`  |
| `KeyNotFoundFileError`                                                                              | `404`  |
| Every `UnableTo*FileError`, for example `UnableToGetPublicUrlFileError` and `UnableToCopyFileError` | `503`  |

A `400` response means the file key is invalid. A `404` response means the file key does not exist. A `503` response means the file storage adapter failed, so the same request can be retried later. The original error is preserved as the `cause`, and no identifiers are exposed in the response body.

## Further information

For further information refer to [`eridu-tech/file-storage`](https://eridu-tech.github.io/eridu-tech-core/modules/FileStorage.html) API docs.
