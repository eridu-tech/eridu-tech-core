---
"eridu-tech": minor
---

Error instances in `eridu-tech/file-storage/contracts` now expose the file identifiers they were created for:

- `KeyNotFoundFileError.key`
- `InvalidKeyFileError.key`
- `UnableToGetPublicUrlFileError.key`
- `UnableToGetSignedDownloadUrlFileError.key`
- `UnableToGetSignedUploadUrlFileError.key`
- `UnableToExistsFileError.key`
- `UnableToGetStreamFileError.key`
- `UnableToGetBytesFileError.key`
- `UnableToGetMetaDataFileError.key`
- `UnableToPutFileError.key`
- `UnableToPutStreamFileError.key`
- `UnableToCopyFileError.source` and `UnableToCopyFileError.destination`
- `UnableToMoveFileError.source` and `UnableToMoveFileError.destination`
- `UnableToRemoveManyFileError.keys`
- `UnableToRemoveByPrefixFileError.prefix`

Each `create()` factory passes the identifiers to the error, so they are available as `readonly` fields alongside the existing `message` and `cause`.
