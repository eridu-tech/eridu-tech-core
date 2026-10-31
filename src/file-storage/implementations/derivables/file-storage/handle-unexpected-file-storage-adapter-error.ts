/**
 * @module FileStorage
 */

import {
    UnableToCopyFileError,
    UnableToExistsFileError,
    UnableToGetBytesFileError,
    UnableToGetMetaDataFileError,
    UnableToGetPublicUrlFileError,
    UnableToGetSignedDownloadUrlFileError,
    UnableToGetSignedUploadUrlFileError,
    UnableToGetStreamFileError,
    UnableToMoveFileError,
    UnableToPutFileError,
    UnableToPutStreamFileError,
    UnableToRemoveByPrefixFileError,
    UnableToRemoveManyFileError,
} from "@/file-storage/contracts/_module-exports.js";

import type { ISignedFileStorageAdapter } from "@/file-storage/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that converts unexpected errors thrown by a file storage adapter into `UnableTo*FileError` errors.
 *
 * Every method of the wrapped `ISignedFileStorageAdapter` is wrapped in a `try`/`catch` block,
 * and the original error is preserved as the `cause` of the matching error:
 * - `getPublicUrl` throws {@link UnableToGetPublicUrlFileError | `UnableToGetPublicUrlFileError`}
 * - `getSignedDownloadUrl` throws {@link UnableToGetSignedDownloadUrlFileError | `UnableToGetSignedDownloadUrlFileError`}
 * - `getSignedUploadUrl` throws {@link UnableToGetSignedUploadUrlFileError | `UnableToGetSignedUploadUrlFileError`}
 * - `exists` throws {@link UnableToExistsFileError | `UnableToExistsFileError`}
 * - `getStream` throws {@link UnableToGetStreamFileError | `UnableToGetStreamFileError`}
 * - `getBytes` throws {@link UnableToGetBytesFileError | `UnableToGetBytesFileError`}
 * - `getMetaData` throws {@link UnableToGetMetaDataFileError | `UnableToGetMetaDataFileError`}
 * - `put` throws {@link UnableToPutFileError | `UnableToPutFileError`}
 * - `putStream` throws {@link UnableToPutStreamFileError | `UnableToPutStreamFileError`}
 * - `copy` throws {@link UnableToCopyFileError | `UnableToCopyFileError`}
 * - `move` throws {@link UnableToMoveFileError | `UnableToMoveFileError`}
 * - `removeMany` throws {@link UnableToRemoveManyFileError | `UnableToRemoveManyFileError`}
 * - `removeByPrefix` throws {@link UnableToRemoveByPrefixFileError | `UnableToRemoveByPrefixFileError`}
 *
 * @returns A middleware plugin that wraps an `ISignedFileStorageAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 * @internal
 */
export function handleUnexpectedFileStorageAdapterError(): PluginFn<ISignedFileStorageAdapter> {
    return (adapter, enhance) => {
        enhance(adapter, "getPublicUrl", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetPublicUrlFileError.create(key, cause);
            }
        });
        enhance(
            adapter,
            "getSignedDownloadUrl",
            async ({ args: [key], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToGetSignedDownloadUrlFileError.create(
                        key,
                        cause,
                    );
                }
            },
        );
        enhance(
            adapter,
            "getSignedUploadUrl",
            async ({ args: [key], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToGetSignedUploadUrlFileError.create(
                        key,
                        cause,
                    );
                }
            },
        );
        enhance(adapter, "exists", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToExistsFileError.create(key, cause);
            }
        });
        enhance(adapter, "getStream", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetStreamFileError.create(key, cause);
            }
        });
        enhance(adapter, "getBytes", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetBytesFileError.create(key, cause);
            }
        });
        enhance(adapter, "getMetaData", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetMetaDataFileError.create(key, cause);
            }
        });
        enhance(adapter, "put", async ({ args: [key], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToPutFileError.create(key, cause);
            }
        });
        enhance(adapter, "putStream", async ({ args: [key], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToPutStreamFileError.create(key, cause);
            }
        });
        enhance(
            adapter,
            "copy",
            async ({ args: [source, destination], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToCopyFileError.create(
                        source,
                        destination,
                        cause,
                    );
                }
            },
        );
        enhance(
            adapter,
            "move",
            async ({ args: [source, destination], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToMoveFileError.create(
                        source,
                        destination,
                        cause,
                    );
                }
            },
        );
        enhance(adapter, "removeMany", async ({ args: [keys], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToRemoveManyFileError.create(keys, cause);
            }
        });
        enhance(adapter, "removeByPrefix", async ({ args: [prefix], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToRemoveByPrefixFileError.create(prefix, cause);
            }
        });
    };
}
