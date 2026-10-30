---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring FileStorage adapters
tags:
    - FileStorage
    - Configuring adapters
    - In-memory
    - File system
    - Aws s3
    - Cloudflare r2
    - Digital ocean spaces
    - Tigris
    - Supabase Storage
    - Minio
    - Sftp
    - Ftp
    - Webdav
    - NoOp
    - Signed
keywords:
    - FileStorage
    - Configuring adapters
    - In-memory
    - File system
    - Aws s3
    - Cloudflare r2
    - Digital ocean spaces
    - Tigris
    - Supabase Storage
    - Minio
    - Sftp
    - Ftp
    - Webdav
    - NoOp
    - Signed
---

# Configuring FileStorage adapters

## MemoryFileStorageAdapter

To use the `MemoryFileStorageAdapter` you only need to create instance of it:

```ts file=./samples/memory-file-storage-adapter.ts

```

You can also provide an `Map` that will be used for storing the files in memory:

```ts file=./samples/memory-file-storage-adapter-with-map.ts

```

:::info
`MemoryFileStorageAdapter` lets you test your app without external dependencies like `@aws-sdk/client-s3`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

:::warning
Note this adapter doesnt have support for creating signed upload, signed download and public urls.
:::

## FsFileStorageAdapter

To use the `FsFileStorageAdapter` you only need to create an instance of it, every setting is optional:

```ts file=./samples/fs-file-storage-adapter.ts

```

You can configure the root folder:

```ts file=./samples/fs-file-storage-adapter-custom-location.ts

```

You can configure codec used for file names:

```ts file=./samples/fs-file-storage-adapter-with-codec.ts

```

:::warning
Not encoding and decoding is required for `FsFileStorageAdapter` to maintain a flat hierarchy within the root folder and to ensure compatibility with OS-restricted characters.
:::

:::warning
Not this adapter does not support signed upload, signed download and public urls.
It also doesnt support explictly setting the content-type and it will instead infer the content-type from the file name.
:::

## S3FileStorageAdapter

To use the `S3FileStorageAdapter`, you'll need to:

1. Install the required dependency: [`@aws-sdk/client-s3`](https://www.npmjs.com/package/@aws-sdk/client-s3) package:

```ts file=./samples/s3-file-storage-adapter.ts

```

Other settings:

```ts file=./samples/s3-file-storage-adapter-settings.ts

```

:::info
Note this adapter with object storage services that are compatible with aws s3 like:

- Cloudflare r2
- Digital ocean spaces
- Tigris
- Supabase Storage
- Minio
  :::

## SftpFileStorageAdapter

To use the `SftpFileStorageAdapter`, you'll need to:

1. Install the required dependency: [`ssh2-sftp-client`](https://www.npmjs.com/package/ssh2-sftp-client) package.
2. Create a pool of SFTP connections with `sftpPool`, which combines `SftpFactory` with a `QueuePool`.

```ts file=./samples/sftp-file-storage-adapter.ts

```

Other settings:

```ts file=./samples/sftp-file-storage-adapter-settings.ts

```

You can build the pool yourself, for example to change the pool size or to share it between adapters:

```ts file=./samples/sftp-file-storage-adapter-custom-pool.ts

```

:::info
`SftpFactory` connects a new `SftpClient` in `create`, checks idle connections with `cwd()` in `validate`, and ends them in `destroy`. Any `IGenericPoolBase<SftpClient>` can be passed as the `pool` setting.
:::

:::warning
This adapter does not support signed upload, signed download and public urls.
It also doesn't support explicitly setting the content-type and will instead infer the content-type from the file name.
:::

## FtpFileStorageAdapter

To use the `FtpFileStorageAdapter`, you'll need to:

1. Install the required dependency: [`basic-ftp`](https://www.npmjs.com/package/basic-ftp) package.
2. Create a pool of FTP connections with `ftpPool`, which combines `FtpFactory` with a `QueuePool`.

```ts file=./samples/ftp-file-storage-adapter.ts

```

Other settings:

```ts file=./samples/ftp-file-storage-adapter-settings.ts

```

You can build the pool yourself, for example to change the pool size or to share it between adapters:

```ts file=./samples/ftp-file-storage-adapter-custom-pool.ts

```

:::info
Set `secure` to `true` for explicit FTPS over TLS, or to `"implicit"` for legacy implicit FTPS. `FtpFactory` opens and logs in a `Client` in `create`, checks idle connections with `pwd()` in `validate`, and closes them in `destroy`. Any `IGenericPoolBase<Client>` can be passed as the `pool` setting.
:::

:::warning
This adapter does not support signed upload, signed download and public urls.
It also doesn't support explicitly setting the content-type and will instead infer the content-type from the file name.
:::

## WebdavFileStorageAdapter

To use the `WebdavFileStorageAdapter`, you'll need to:

1. Install the required dependency: [`webdav`](https://www.npmjs.com/package/webdav) package.
2. Create a client with `createClient` and pass it to the adapter.

```ts file=./samples/webdav-file-storage-adapter.ts

```

Other settings:

```ts file=./samples/webdav-file-storage-adapter-settings.ts

```

:::info
The adapter keeps the WebDAV client it is given, so a single client serves every operation. Configure authentication, headers and `remoteBasePath` on the client itself.
:::

:::warning
This adapter does not support signed upload, signed download and public urls.
It also doesn't support explicitly setting the content-type and will instead infer the content-type from the file name.
:::

## SignedFileStorageAdapter

The `SignedFileStorageAdapter` merges a regular file storage adapter with a URL adapter into a single [`ISignedFileStorageAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/FileStorage.ISignedFileStorageAdapter.html).

The `adapter` handles all file CRUD operations (create, read, update, delete, copy and move), while the `urlAdapter` handles public and signed URL generation.

This is useful for storage backends where file operations and signed URL generation are handled separately, for example a database-backed storage adapter combined with an S3 URL adapter. Since `S3FileStorageAdapter` already implements signed URL generation, you typically use `SignedFileStorageAdapter` when you need to pair a regular adapter (that does not generate URLs) with your own URL generation logic.

To use the `SignedFileStorageAdapter` you need to provide:

- `adapter`: The underlying file storage adapter that handles file operations. It is not required to implement signed URL generation.
- `urlAdapter`: A partial URL adapter for generating public and signed URLs. Only the URL methods your storage backend supports need to be provided.

Basic usage:

```ts file=./samples/signed-file-storage-adapter.ts

```

You can provide the URL methods that your storage backend supports:

```ts file=./samples/signed-file-storage-adapter-url-methods.ts

```

:::info
Any omitted URL method falls back to a no-op implementation:

- `getPublicUrl` returns `null`
- `getSignedDownloadUrl` returns `null`
- `getSignedUploadUrl` returns an empty string
  :::

## NoOpFileStorageAdapter

The `NoOpFileStorageAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./samples/no-op-file-storage-adapter.ts

```

:::info
The `NoOpFileStorageAdapter` is useful when you want to mock out or disable your `FileStorage` instance.
:::

## Further information

For further information refer to [`eridu-tech/file-storage`](https://eridu-tech.github.io/eridu-tech-core/modules/file-storage.html) API docs.
