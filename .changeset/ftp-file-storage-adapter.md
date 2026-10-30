---
"eridu-tech": minor
---

New `FtpFileStorageAdapter` for storing files on an FTP server, available from `eridu-tech/file-storage/ftp-file-storage-adapter`.

- The `pool` setting accepts an `IGenericPoolBase<Client>`: an `IGenericPool` (for example `QueuePool` or `SingleResourcePool`) is borrowed from and released on every operation, so concurrent calls do not share one connection.
- `FtpFactory` is an `IResourceFactory<Client>` for those pools. It opens and logs in with `accessSettings`, applies `timeout` (default `30000`) and `clientSettings`, closes the connection on destroy, and validates idle connections with `pwd()`. A custom `clientFactory` replaces the whole connect step, so use it when connections need custom setup, such as upgrading to FTPS.
- `ftpPool()` combines the factory with an optional `poolFactory` into a ready-to-use pool.
- Keys map to nested folders under `location` (default `"/"`), split by `delimiter` (default `"/"`), and each segment is encoded with `codec` (default `Base64UrlCodec`). Unsafe characters work and keys such as `"../secret"` cannot escape the root folder.
- `pathType` selects POSIX or win32 path handling and defaults to `PATH_TYPE.POSIX`.
- Implements the full `IFileStorageAdapter` contract, including `putStream()`, `copy()`, `move()`, `removeMany()` and `removeByPrefix()`. `getMetaData()` returns an `etag` derived from the remote size and modification time, and a missing file resolves to `null`/`false` instead of throwing.

Requires `basic-ftp` as an optional peer dependency.
