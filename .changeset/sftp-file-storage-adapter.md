---
"eridu-tech": minor
---

New `SftpFileStorageAdapter` for storing files on an SFTP server, available from `eridu-tech/file-storage/sftp-file-storage-adapter`.

- The `pool` setting accepts a `IGenericPoolBase<SftpClient>`: an `IGenericPool` (for example `QueuePool` or `SingleResourcePool`) is borrowed from and released on every operation, so concurrent calls do not share one connection.
- `SftpFactory` is an `IResourceFactory<SftpClient>` for those pools. It connects with `SftpClient.ConnectOptions`, ends the connection on destroy, and validates idle connections with `cwd()`.
- Keys map to nested folders under `location` (default `"/"`), split by `delimiter` (default `"/"`), and each segment is encoded with `codec` (default `Base64UrlCodec`). Unsafe characters work and keys such as `"../secret"` cannot escape the root folder.
- `pathType` selects POSIX or win32 path handling and defaults to `PATH_TYPE.POSIX`.
- Implements the full `IFileStorageAdapter` contract, including `putStream()`, `copy()`, `move()`, `removeMany()` and `removeByPrefix()`.

Requires `ssh2-sftp-client` as a peer dependency.
