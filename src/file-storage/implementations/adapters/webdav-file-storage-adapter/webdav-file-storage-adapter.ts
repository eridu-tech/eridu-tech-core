/**
 * @module FileStorage
 */

import { PassThrough, Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

import etag from "etag";

import { Base64UrlCodec } from "@/codec/implementations/base-64-url-codec/_module-exports.js";
import { FsKeyPathMapper } from "@/file-storage/implementations/adapters/_shared/_module.js";
import { UnexpectedError } from "@/utilities/errors.js";

import type {
    BufferLike,
    FileStat,
    ReadableLike,
    ResponseDataDetailed,
    WebDAVClient,
    WritableLike,
} from "webdav";

import type { ICodec } from "@/codec/contracts/_module-exports.js";
import type {
    FileAdapterMetadata,
    IFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";
import type { Bytes, ByteStream } from "@/utilities/_module-exports.js";

/**
 * Configuration for `WebdavFileStorageAdapter`.
 * Provides local filesystem-based file storage.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/webdav-file-storage-adapter"`
 * @group Adapters
 */
export type WebdavFileStorageAdapterSettings = {
    client: WebDAVClient;

    /**
     * Character that splits a key into segments (`"a/b"` → `"a"`, `"b"`).
     * Each segment becomes a folder, so long keys avoid the file name length
     * limit.
     *
     * @default "/"
     */
    delimiter?: string;

    /**
     * Codec that encodes each key segment into a safe file name and back. The
     * default base64url allows characters like `":"` or `"*"` and stops keys
     * such as `"../secret"` from escaping the root folder.
     *
     * @default
     * ```ts
     * new Base64UrlCodec()
     * ```
     */
    codec?: ICodec<string, string>;
};

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/webdav-file-storage-adapter"`
 * @group Adapters
 */
export class WebdavFileStorageAdapter implements IFileStorageAdapter {
    private readonly client: WebDAVClient;
    private readonly keyPathMapper: FsKeyPathMapper;

    constructor(settings: WebdavFileStorageAdapterSettings) {
        const {
            client,
            codec = new Base64UrlCodec(),
            delimiter = "/",
        } = settings;
        this.client = client;
        this.keyPathMapper = new FsKeyPathMapper(delimiter, codec);
    }

    async exists(key: string): Promise<boolean> {
        const path = this.keyPathMapper.toPath(key);
        return await this.client.exists(path);
    }

    private static resolveReadableLike(readableLike: ReadableLike): Readable {
        if (readableLike instanceof Readable) {
            return readableLike;
        }

        const readable = new PassThrough();
        readableLike.once("error", (error: Error) => {
            readable.destroy(error);
        });
        readableLike.pipe(readable);
        return readable;
    }

    async getStream(key: string): Promise<ByteStream | null> {
        const path = this.keyPathMapper.toPath(key);
        if (!(await this.client.exists(path))) {
            return null;
        }

        const readable = WebdavFileStorageAdapter.resolveReadableLike(
            this.client.createReadStream(path),
        );
        return readable;
    }

    private static resolveWebDavData(
        value: string | BufferLike | ResponseDataDetailed<string | BufferLike>,
    ): Bytes {
        if (value instanceof ArrayBuffer) {
            return new Uint8Array(value);
        }
        if (value instanceof Uint8Array) {
            return value;
        }

        throw UnexpectedError.create(
            "WebDAV getFileContents returned an unsupported data format; expected binary file contents",
        );
    }

    private static isFileNotFoundError(error: unknown): boolean {
        return (
            error instanceof Error &&
            error.message === "Invalid response: 404 Not Found"
        );
    }

    async getBytes(key: string): Promise<Bytes | null> {
        try {
            const path = this.keyPathMapper.toPath(key);
            const data = await this.client.getFileContents(path);
            return WebdavFileStorageAdapter.resolveWebDavData(data);
        } catch (error: unknown) {
            if (WebdavFileStorageAdapter.isFileNotFoundError(error)) {
                return null;
            }
            throw error;
        }
    }

    private static resolveWebdavStat(
        fileStat: FileStat | ResponseDataDetailed<FileStat>,
    ): FileStat {
        return "data" in fileStat ? fileStat.data : fileStat;
    }

    private static toStats(fileStat: FileStat): etag.StatsLike {
        if (!Number.isFinite(fileStat.size) || fileStat.size < 0) {
            throw UnexpectedError.create(
                `WebDAV stat size is invalid: ${String(fileStat.size)}`,
            );
        }
        if (
            typeof fileStat.lastmod !== "string" ||
            fileStat.lastmod.length === 0
        ) {
            throw UnexpectedError.create("WebDAV stat lastmod is missing");
        }
        const mtime = new Date(fileStat.lastmod);
        if (Number.isNaN(mtime.getTime())) {
            throw UnexpectedError.create(
                `WebDAV stat lastmod is invalid: ${fileStat.lastmod}`,
            );
        }

        return {
            ctime: mtime,
            mtime,
            ino: 0,
            size: fileStat.size,
        };
    }

    private static toFileMetadata(stat: FileStat): FileAdapterMetadata {
        return {
            etag: stat.etag ?? etag(this.toStats(stat)),
            contentType: null,
            fileSizeInBytes: stat.size,
            updatedAt: new Date(stat.lastmod),
        };
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        try {
            const path = this.keyPathMapper.toPath(key);
            const webdavStat = await this.client.stat(path);
            const resolvedWebdavStat =
                WebdavFileStorageAdapter.resolveWebdavStat(webdavStat);
            return WebdavFileStorageAdapter.toFileMetadata(resolvedWebdavStat);
        } catch (error: unknown) {
            if (WebdavFileStorageAdapter.isFileNotFoundError(error)) {
                return null;
            }
            throw error;
        }
    }

    async put(key: string, content: WritableFileAdapterContent): Promise<void> {
        const path = this.keyPathMapper.toPath(key);
        const directory = this.keyPathMapper.toDirectoryPath(key);

        await this.client.createDirectory(directory, {
            recursive: true,
        });
        await this.client.putFileContents(path, Buffer.from(content.data), {
            overwrite: true,
            contentLength: content.fileSizeInBytes,
        });
    }

    private static resolveWritableLike(writableLike: WritableLike): Writable {
        if (writableLike instanceof Writable) {
            return writableLike;
        }

        const writable = new Writable({
            write(chunk, _encoding, callback) {
                writableLike.write(chunk, callback);
            },
            final(callback) {
                writableLike.end(callback);
            },
        });
        writableLike.once("error", (error: Error) => {
            writable.destroy(error);
        });
        return writable;
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<void> {
        const path = this.keyPathMapper.toPath(key);
        const directory = this.keyPathMapper.toDirectoryPath(key);

        await this.client.createDirectory(directory, {
            recursive: true,
        });
        const writeStream = WebdavFileStorageAdapter.resolveWritableLike(
            this.client.createWriteStream(path, {
                overwrite: true,
            }),
        );
        await pipeline(stream.data, writeStream);
    }

    private async _removeMany(keys: Array<string>): Promise<void> {
        const promises = [
            ...new Set(
                keys.map((key) => {
                    return this.keyPathMapper.toPath(key);
                }),
            ),
        ].map(async (path) => {
            try {
                await this.client.deleteFile(path);
            } catch (error: unknown) {
                if (WebdavFileStorageAdapter.isFileNotFoundError(error)) {
                    return;
                }
                throw error;
            }
        });
        await Promise.all(promises);
    }

    private async _copy(source: string, destination: string): Promise<boolean> {
        try {
            const sourcePath = this.keyPathMapper.toPath(source);
            const destinationPath = this.keyPathMapper.toPath(destination);
            const destinationDirectory =
                this.keyPathMapper.toDirectoryPath(destination);

            await this.client.createDirectory(destinationDirectory, {
                recursive: true,
            });
            await this.client.copyFile(sourcePath, destinationPath, {
                overwrite: true,
            });
            return true;
        } catch (error: unknown) {
            if (WebdavFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    copy(source: string, destination: string): Promise<boolean> {
        return this._copy(source, destination);
    }

    async move(source: string, destination: string): Promise<boolean> {
        const hasMoved = await this._copy(source, destination);
        if (hasMoved) {
            await this._removeMany([source]);
        }
        return hasMoved;
    }

    async removeMany(keys: Array<string>): Promise<void> {
        return this._removeMany(keys);
    }

    private async removeDir(path: string): Promise<void> {
        const items = await this.client.getDirectoryContents(path);
        for (const item of items) {
            await this.client.deleteFile(item.filename);
        }
    }

    async removeByPrefix(prefix: string): Promise<void> {
        if (prefix === "") {
            await this.removeDir("/");
            return;
        }

        const items = await this.client.getDirectoryContents("/", {
            deep: true,
        });
        const files = items.filter((item) => item.type === "file");
        for (const file of files) {
            if (
                !this.keyPathMapper
                    .fromPath(file.filename)
                    .slice(1)
                    .startsWith(prefix)
            ) {
                continue;
            }

            try {
                await this.client.deleteFile(file.filename);
            } catch (error: unknown) {
                if (WebdavFileStorageAdapter.isFileNotFoundError(error)) {
                    continue;
                }
                throw error;
            }
        }
    }
}
