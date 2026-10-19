/**
 * @module FileStorage
 */

/**
 * Configuration for generating temporary signed download URLs for files.
 * These settings control how the presigned download URL behaves when accessed.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type FileAdapterSignedDownloadUrlSettings = {
    /**
     * Time in seconds until the signed download URL expires.
     * After expiration, the URL becomes invalid and clients must request a new one.
     */
    expirationInSeconds: number;

    /**
     * MIME type of the file content.
     * When set, the response will include the Content-Type header with this value.
     * Null indicates the storage backend should determine the type automatically.
     */
    contentType: string | null;

    /**
     * Content-Disposition header value controlling how browsers handle the download.
     * "attachment" forces download to disk, "inline" displays in browser.
     * Null means the storage backend will use default behavior.
     */
    contentDisposition: string | null;
};

/**
 * Configuration for generating temporary signed upload URLs for files.
 * These settings control how the presigned upload URL behaves and what files can be uploaded.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type FileAdapterSignedUploadUrlSettings = {
    /**
     * Time in seconds until the signed upload URL expires.
     * After expiration, clients cannot use this URL to upload files.
     * Typically shorter than download URL expiration for security.
     */
    expirationInSeconds: number;

    /**
     * Expected MIME type of files being uploaded.
     * Some storage backends use this to validate uploads (e.g., S3 Content-Type policy).
     * Null means any content type is accepted.
     */
    contentType: string | null;
};

/**
 * URL adapter contract for generating secure, temporary URLs for file access and uploads.
 * Provides public URLs for direct access, signed URLs with expiration for download/upload operations.
 * Abstract the URL generation logic, allowing different storage backends to implement URL strategies.
 *
 * This adapter role separates concerns:
 * - Storage adapters handle file data (read/write/delete)
 * - URL adapters handle access control (signed URLs with expiration)
 *
 * All methods operate on files via `key` identifier.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type IFileUrlAdapter = {
    /**
     * Generates a public, permanently-accessible URL for a file.
     * A public URL string is always returned; failures surface as thrown errors.
     *
     * @param key - The file identifier/path
     *
     * @returns The public URL
     * @throws Error if public URL generation fails or public access is not supported by the adapter
     */
    getPublicUrl(key: string): Promise<string>;

    /**
     * Generates a temporary signed URL for downloading a file.
     * The URL expires after the configured duration and becomes invalid.
     * Some backends may return a signed URL that fails when accessed if existence checks are disabled.
     * A signed URL string is always returned; failures surface as thrown errors.
     *
     * @param key - The file identifier/path
     * @param settings - Configuration for the signed URL (expiration, content type, disposition)
     *
     * @returns The signed download URL
     * @throws Error if signed URL generation fails
     */
    getSignedDownloadUrl(
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string>;

    /**
     * Generates a temporary signed URL for uploading a file.
     * The URL expires after the configured duration and becomes invalid.
     * Throws if URL generation fails (storage system misconfiguration).
     *
     * @param key - The file identifier/path where upload will be stored
     * @param settings - Configuration for the signed URL (expiration, expected content type)
     *
     * @returns The signed upload URL (must always return a valid URL)
     * @throws Error if signed URL generation fails
     */
    getSignedUploadUrl(
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string>;
};

/**
 * File metadata object returned when reading file information.
 * Contains properties describing file state, size, and modification times.
 * Immutable snapshot used for cache validation and file information endpoints.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type FileAdapterMetadata = {
    /**
     * Entity tag (ETag) for cache validation.
     * Used in HTTP ETag headers and If-Match conditionals to detect file changes.
     * Different storage backends may use different formats, but value remains unique per file version.
     */
    etag: string;

    /**
     * MIME type of the file content.
     * Determines how browsers/clients should handle the file (e.g., display vs. download).
     */
    contentType: string | null;

    /**
     * Size of the file in bytes.
     * Used for progress tracking, quota validation, and file listings.
     */
    fileSizeInBytes: number;

    /**
     * File's last modification date (creation or update).
     * Tracks when the file was created (if new) or last updated (if modified).
     * Used for cache validation, sorting, and auditing.
     */
    updatedAt: Date;
};

/**
 * Async iterable stream of file content chunks.
 * Each chunk is a Uint8Array representing a portion of the file.
 * Allows streaming large files without loading entire content into memory.
 *
 * Used for both reading (download) and writing (upload) operations.
 * Iterating the stream will fetch/produce chunks sequentially.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type FileAdapterStream = AsyncIterable<Uint8Array>;

/**
 * Common HTTP headers configuration for writable file operations.
 * These settings control caching, compression, and client-side behavior for files.
 *
 * Shared between content (bytes) and stream write operations.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileAdapterCommonSettings = {
    /**
     * MIME type of the file content.
     * Determines how browsers/clients interpret and render the file.
     * Required field that guides content handling on retrieval.
     */
    contentType: string;

    /**
     * Content-Language header specifying the natural language of the content.
     * Used by browsers for language-specific handling and for accessibility.
     * Null means language is unspecified or should not be sent.
     */
    contentLanguage: string | null;

    /**
     * Content-Encoding header specifying compression or transformation applied to the content.
     * Informs clients what decoding is needed before using the file.
     * Must match the actual encoding of the stored file.
     */
    contentEncoding: string | null;

    /**
     * Content-Disposition header controlling how the file is displayed/downloaded.
     * "attachment" forces browser download, "inline" displays in browser.
     * Used to suggest filename when downloaded.
     */
    contentDisposition: string | null;

    /**
     * Cache-Control header directing browser and CDN caching behavior.
     * Controls how long files can be cached and whether revalidation is needed.
     * Null means storage backend applies default caching policy.
     */
    cacheControl: string | null;
};

/**
 * Configuration for writing file content as a complete byte array.
 * Extends common HTTP headers with complete file data and size.
 *
 * Used when entire file content is available in memory (smaller files).
 * All content is provided upfront before write operation.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileAdapterContent = WritableFileAdapterCommonSettings & {
    /**
     * Complete file content as a byte array.
     * Must be loaded entirely in memory before writing.
     * For large files, use WritableFileAdapterStream instead.
     */
    data: Uint8Array;

    /**
     * Size of the complete file in bytes.
     * Must match the actual length of the data array.
     * Used for validation, quota checks, and storage pre-allocation.
     */
    fileSizeInBytes: number;
};

/**
 * Configuration for writing file content as an async stream.
 * Extends common HTTP headers with streaming file data.
 *
 * Used when file content is too large for memory or comes from a streaming source.
 * Content is transmitted in chunks, allowing memory-efficient processing.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type WritableFileAdapterStream = WritableFileAdapterCommonSettings & {
    /**
     * Async iterable stream of file content chunks.
     * Each chunk is a Uint8Array produced sequentially as iteration progresses.
     * Used for large files, piped sources, or real-time content generation.
     */
    data: FileAdapterStream;

    /**
     * Total expected file size in bytes.
     * If known, helps storage backends pre-allocate space and validate quota.
     * Null when size cannot be determined upfront (e.g., streamed from external API).
     * If null, storage must accept streams of unknown size.
     */
    fileSizeInBytes: number | null;
};

/**
 * File storage adapter contract defining complete file operations.
 * Abstracts storage backend implementation (local filesystem, S3, database, memory, etc).
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorageAdapter = {
    /**
     * Checks whether a file exists at the given key.
     *
     * @param key - The file identifier/path to check
     *
     * @returns True if file exists, false otherwise
     */
    exists(key: string): Promise<boolean>;

    /**
     * Retrieves file content as an async stream of byte chunks.
     * Memory-efficient for large files - content is streamed rather than loaded entirely.
     * Returns null if the file does not exist.
     *
     * @param key - The file identifier/path
     *
     * @returns Async iterable of Uint8Array chunks, or null if file not found
     */
    getStream(key: string): Promise<FileAdapterStream | null>;

    /**
     * Retrieves complete file content as a byte array.
     * The entire file must fit in memory - use getStream for large files.
     * Returns null if the file does not exist.
     *
     * @param key - The file identifier/path
     *
     * @returns Complete file bytes as Uint8Array, or null if file not found
     */
    getBytes(key: string): Promise<Uint8Array | null>;

    /**
     * Retrieves file metadata (ETag, content type, size, modification date).
     * Returns null if the file does not exist.
     * Useful for cache validation and file information endpoints.
     *
     * @param key - The file identifier/path
     *
     * @returns File metadata object, or null if file not found
     */
    getMetaData(key: string): Promise<FileAdapterMetadata | null>;

    /**
     * Creates or overwrites file (upsert) at key with content.
     * Always succeeds: creates file if doesn't exist, overwrites if exists.
     * Content is loaded entirely in memory - use putStream for large files.
     *
     * @param key - The file identifier/path to create or update
     * @param content - File content with HTTP headers configuration
     */
    put(key: string, content: WritableFileAdapterContent): Promise<void>;

    /**
     * Creates or overwrites file (upsert) at key using streaming content.
     * Always succeeds: creates file if doesn't exist, overwrites if exists.
     * Content is streamed - efficient for large files or continuous data sources.
     *
     * @param key - The file identifier/path to create or update
     * @param stream - File content stream with HTTP headers configuration
     */
    putStream(key: string, stream: WritableFileAdapterStream): Promise<void>;

    /**
     * Copies source file to destination path, overwriting destination if it exists.
     * Returns false if source doesn't exist; destination remains unchanged.
     *
     * @param source - Source file identifier/path to copy from
     * @param destination - Destination file identifier/path to copy to (will be overwritten)
     *
     * @returns True if source was found and copied, false if source doesn't exist
     */
    copy(source: string, destination: string): Promise<boolean>;

    /**
     * Moves (renames) source file to destination path, overwriting destination if it exists.
     * Returns false if source doesn't exist; destination remains unchanged.
     * Effectively deletes the source file after successful copy.
     *
     * @param source - Source file identifier/path to move from
     * @param destination - Destination file identifier/path to move to (will be overwritten)
     *
     * @returns True if source was found and copied, false if source doesn't exist
     */
    move(source: string, destination: string): Promise<boolean>;

    /**
     * Removes multiple specific files by key.
     *
     * @param keys - Array of file identifiers/paths to delete
     */
    removeMany(keys: Array<string>): Promise<void>;

    /**
     * Removes all files whose keys start with the given prefix.
     * Useful for batch deletion by directory or namespace.
     * Silently succeeds if no keys match the prefix.
     *
     * @param prefix - Key prefix to match (e.g., "uploads/2024-01/" for all January uploads)
     */
    removeByPrefix(prefix: string): Promise<void>;
};

/**
 * Combined file storage adapter contract providing complete file operations plus signed URL generation.
 * Merges IFileStorageAdapter (file CRUD operations) and IFileUrlAdapter (URL generation).
 *
 * Useful for storage backends that support both file operations and signed URLs natively.
 * Implementations handle:
 * - Complete file lifecycle (create, read, update, delete, copy, move)
 * - Public URL generation for direct browser access
 * - Temporary signed URLs for secure download/upload without client credentials
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type ISignedFileStorageAdapter = IFileUrlAdapter & IFileStorageAdapter;
