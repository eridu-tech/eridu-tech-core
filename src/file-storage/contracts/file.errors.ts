/**
 * @module FileStorage
 */

import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * The error is thrown when a file key is not found
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class KeyNotFoundFileError extends Error {
    static create(key: string, cause?: unknown): KeyNotFoundFileError {
        return new KeyNotFoundFileError(`Key "${key}" is not found`, cause);
    }

    /**
     * Note: Do not instantiate `KeyNotFoundFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = KeyNotFoundFileError.name;
    }
}

/**
 * The error is thrown when file key is invalid.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class InvalidKeyFileError extends Error {
    static create(message: string, cause?: unknown): InvalidKeyFileError {
        return new InvalidKeyFileError(message, cause);
    }

    /**
     * Note: Do not instantiate `InvalidKeyFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = InvalidKeyFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while generating a public URL.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToGetPublicUrlFileError extends Error {
    static create(key: string, cause?: unknown): UnableToGetPublicUrlFileError {
        return new UnableToGetPublicUrlFileError(
            `Unable to get public url of file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetPublicUrlFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetPublicUrlFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while generating a signed download URL.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToGetSignedDownloadUrlFileError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToGetSignedDownloadUrlFileError {
        return new UnableToGetSignedDownloadUrlFileError(
            `Unable to get signed download url of file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetSignedDownloadUrlFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetSignedDownloadUrlFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while generating a signed upload URL.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToGetSignedUploadUrlFileError extends Error {
    static create(
        key: string,
        cause?: unknown,
    ): UnableToGetSignedUploadUrlFileError {
        return new UnableToGetSignedUploadUrlFileError(
            `Unable to get signed upload url of file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetSignedUploadUrlFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetSignedUploadUrlFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while checking whether a file exists.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToExistsFileError extends Error {
    static create(key: string, cause?: unknown): UnableToExistsFileError {
        return new UnableToExistsFileError(
            `Unable to check existence of file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToExistsFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToExistsFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while retrieving a file stream.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToGetStreamFileError extends Error {
    static create(key: string, cause?: unknown): UnableToGetStreamFileError {
        return new UnableToGetStreamFileError(
            `Unable to get stream of file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetStreamFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetStreamFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while retrieving file bytes.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToGetBytesFileError extends Error {
    static create(key: string, cause?: unknown): UnableToGetBytesFileError {
        return new UnableToGetBytesFileError(
            `Unable to get bytes of file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetBytesFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetBytesFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while retrieving file metadata.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToGetMetaDataFileError extends Error {
    static create(key: string, cause?: unknown): UnableToGetMetaDataFileError {
        return new UnableToGetMetaDataFileError(
            `Unable to get metadata of file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToGetMetaDataFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToGetMetaDataFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while writing a file.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToPutFileError extends Error {
    static create(key: string, cause?: unknown): UnableToPutFileError {
        return new UnableToPutFileError(
            `Unable to put file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToPutFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToPutFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while writing a file stream.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToPutStreamFileError extends Error {
    static create(key: string, cause?: unknown): UnableToPutStreamFileError {
        return new UnableToPutStreamFileError(
            `Unable to put stream of file with key "${key}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToPutStreamFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToPutStreamFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while copying a file.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToCopyFileError extends Error {
    static create(
        source: string,
        destination: string,
        cause?: unknown,
    ): UnableToCopyFileError {
        return new UnableToCopyFileError(
            `Unable to copy file from "${source}" to "${destination}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToCopyFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToCopyFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while moving a file.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToMoveFileError extends Error {
    static create(
        source: string,
        destination: string,
        cause?: unknown,
    ): UnableToMoveFileError {
        return new UnableToMoveFileError(
            `Unable to move file from "${source}" to "${destination}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToMoveFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToMoveFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while removing multiple files.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToRemoveManyFileError extends Error {
    static create(
        keys: Array<string>,
        cause?: unknown,
    ): UnableToRemoveManyFileError {
        return new UnableToRemoveManyFileError(
            `Unable to remove files with keys "${keys.join(", ")}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToRemoveManyFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRemoveManyFileError.name;
    }
}

/**
 * The error is thrown when the underlying file storage adapter fails with an unexpected error while removing files by prefix.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export class UnableToRemoveByPrefixFileError extends Error {
    static create(
        prefix: string,
        cause?: unknown,
    ): UnableToRemoveByPrefixFileError {
        return new UnableToRemoveByPrefixFileError(
            `Unable to remove files with prefix "${prefix}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToRemoveByPrefixFileError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRemoveByPrefixFileError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export const FILE_STORAGE_ERRORS = {
    KeyNotFound: KeyNotFoundFileError,
    InvalidKey: InvalidKeyFileError,
    UnableToGetPublicUrl: UnableToGetPublicUrlFileError,
    UnableToGetSignedDownloadUrl: UnableToGetSignedDownloadUrlFileError,
    UnableToGetSignedUploadUrl: UnableToGetSignedUploadUrlFileError,
    UnableToExists: UnableToExistsFileError,
    UnableToGetStream: UnableToGetStreamFileError,
    UnableToGetBytes: UnableToGetBytesFileError,
    UnableToGetMetaData: UnableToGetMetaDataFileError,
    UnableToPut: UnableToPutFileError,
    UnableToPutStream: UnableToPutStreamFileError,
    UnableToCopy: UnableToCopyFileError,
    UnableToMove: UnableToMoveFileError,
    UnableToRemoveMany: UnableToRemoveManyFileError,
    UnableToRemoveByPrefix: UnableToRemoveByPrefixFileError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export type AllFileErrors = InferInstance<
    (typeof FILE_STORAGE_ERRORS)[keyof typeof FILE_STORAGE_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Errors
 */
export function isFileError(value: unknown): value is AllFileErrors {
    for (const errorClass of Object.values(FILE_STORAGE_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
