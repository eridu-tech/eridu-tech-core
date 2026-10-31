---
"eridu-tech": minor
---

New `UnableTo` errors that describe a file storage adapter failure, available from `eridu-tech/file-storage/contracts`:

- `UnableToGetPublicUrlFileError`
- `UnableToGetSignedDownloadUrlFileError`
- `UnableToGetSignedUploadUrlFileError`
- `UnableToExistsFileError`
- `UnableToGetStreamFileError`
- `UnableToGetBytesFileError`
- `UnableToGetMetaDataFileError`
- `UnableToPutFileError`
- `UnableToPutStreamFileError`
- `UnableToCopyFileError`
- `UnableToMoveFileError`
- `UnableToRemoveManyFileError`
- `UnableToRemoveByPrefixFileError`

They are registered in `FILE_STORAGE_ERRORS`, so `isFileError()` and `AllFileErrors` include them. Each error wraps the unexpected adapter error as its `cause`, and the `IReadableFile`, `IFile` and `IFileStorage` methods now document the `UnableTo` error they can throw when the underlying adapter fails, alongside `KeyNotFoundFileError`.

The new `handleUnexpectedFileStorageAdapterError` plugin applies that mapping to every adapter method. `FileStorage` wraps the provided adapter with it internally, so every `ISignedFileStorageAdapter` method is guarded and rethrows the matching error with the original error as its cause. Files created by the storage, including deserialized ones, therefore only reject with file storage errors.
