---
"eridu-tech": minor
---

The file-storage contracts now expose a single upsert write path and non-nullable URLs.

- `IFileStorageAdapter.put()` and `IFileStorageAdapter.putStream()` return `Promise<void>` instead of a boolean indicating whether the file already existed.
- `IFileStorageAdapter.copy()` and `IFileStorageAdapter.move()` return `Promise<boolean>` and overwrite the destination when it exists, replacing the previous enum-based `copy()`/`move()` and the separate `copyAndReplace()`/`moveAndReplace()` methods.
- `IFileStorageAdapter.removeMany()` and `IFileStorage.removeMany()` return `Promise<void>`.
- `IFileUrlAdapter.getPublicUrl()` and `IFileUrlAdapter.getSignedDownloadUrl()` return `Promise<string>` and report failures by throwing instead of returning `null`.
- `IReadableFile.getPublicUrl()` and `IReadableFile.getSignedDownloadUrl()` follow the same non-nullable contract, returning a URL or throwing when the file is not found or public access is unsupported.
- `IFile.put()`, `IFile.putStream()` and `IFile.remove()` return `Promise<void>`.
- `IFile.copyOrFail()` and `IFile.moveOrFail()` no longer throw `KeyExistsFileError`, since `copy()` and `move()` overwrite the destination.
- `file-storage-adapter.contract.ts` is re-exported as types only from `eridu-tech/file-storage/contracts`.

### Breaking changes

- Removed `IFileStorageAdapter.add()`, `addStream()`, `update()` and `updateStream()`; use `put()`/`putStream()`, which upsert.
- Removed `IFileStorageAdapter.copyAndReplace()` and `moveAndReplace()`; `copy()` and `move()` now overwrite existing destinations.
- Removed the `FILE_WRITE_ENUM` constant and `FileWriteEnum` type.
- Removed `IFile.add()`, `addOrFail()`, `addStream()`, `addStreamOrFail()`, `update()`, `updateOrFail()`, `updateStream()`, `updateStreamOrFail()` and `removeOrFail()`; use `put()`/`putStream()` and `remove()`.
- Removed `IFile.copyAndReplace()`, `copyAndReplaceOrFail()`, `moveAndReplace()` and `moveAndReplaceOrFail()`; use `copy()`/`move()` or their `*OrFail` variants, which now replace the destination.
- `IFile.getPublicUrl()` and `IFile.getSignedDownloadUrl()` no longer return `null`; the `getPublicUrlOrFail()` and `getSignedDownloadUrlOrFail()` variants were removed.
- Removed `KeyExistsFileError`; `FILE_STORAGE_ERRORS` no longer contains a `KeyExists` entry.
