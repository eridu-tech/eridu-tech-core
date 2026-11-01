/**
 * @module FileStorage
 */

import * as posix from "node:path/posix";
import * as win32 from "node:path/win32";
import { Readable, finished } from "node:stream";
import { pipeline } from "node:stream/promises";

import etag from "etag";

import { Base64UrlCodec } from "@/codec/implementations/base-64-url-codec/_module-exports.js";
import { FsKeyPathMapper } from "@/file-storage/implementations/adapters/_shared/_module.js";
import { UnexpectedError } from "@/utilities/errors.js";

import type SftpClient from "ssh2-sftp-client";

import type { ICodec } from "@/codec/contracts/_module-exports.js";
import type {
    FileAdapterMetadata,
    FileAdapterStream,
    IFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";
import type { IGenericPoolBase } from "@/generic-pool/contracts/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export const PATH_TYPE = {
    POSIX: "posix",
    WIN_32: "win32",
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export type PathType = (typeof PATH_TYPE)[keyof typeof PATH_TYPE];

/**
 * Configuration for `SftpFileStorageAdapter`.
 * Provides local filesystem-based file storage.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/sftp-file-storage-adapter"`
 * @group Adapters
 */
export type SftpFileStorageAdapterSettings = {
    pool: IGenericPoolBase<SftpClient>;

    /**
     * @default
     * ```ts
     * import {PATH_TYPE} from "eridu-tech/file-storage/sftp-file-storage-adapter";
     *
     * PATH_TYPE.POSIX
     * ```
     */
    pathType?: PathType;

    /**
     * Writable root directory within the SFTP user's chroot.
     *
     * Paths are always built with POSIX semantics, regardless of the host OS.
     * Use forward slashes for Windows SFTP servers as well (`"/C:/upload"`).
     *
     * @default "/"
     */
    location?: string;

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
 * @internal
 */
class SftpRecursiveFileWalker implements AsyncIterable<string> {
    constructor(
        private readonly client: SftpClient,
        private readonly path: string,
        private readonly join: (...paths: Array<string>) => string,
        private readonly normalize: (path_: string) => string,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<string> {
        const results = await this.client.list(this.path);
        for (const result of results) {
            const isDirectory = result.type === "d";
            const path = this.join(this.path, result.name);
            if (isDirectory) {
                yield* new SftpRecursiveFileWalker(
                    this.client,
                    this.normalize(path),
                    this.join,
                    this.normalize,
                );
            } else {
                yield path;
            }
        }
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/Sftp-file-storage-adapter"`
 * @group Adapters
 */
export class SftpFileStorageAdapter implements IFileStorageAdapter {
    private readonly keyPathMapper: FsKeyPathMapper;
    private readonly location: string;
    private readonly pathType: PathType;
    private readonly pool: IGenericPoolBase<SftpClient>;

    constructor(settings: SftpFileStorageAdapterSettings) {
        const {
            pool,
            codec = new Base64UrlCodec(),
            delimiter = "/",
            location = "/",
            pathType = PATH_TYPE.POSIX,
        } = settings;
        this.keyPathMapper = new FsKeyPathMapper(delimiter, codec);
        this.pathType = pathType;
        this.location = location;
        this.pool = pool;
    }

    private normalize(path: string): string {
        if (this.pathType === "posix") {
            return posix.normalize(path);
        }
        return win32.normalize(path);
    }

    private resolve(...paths: Array<string>): string {
        if (this.pathType === "posix") {
            return posix.resolve(...paths);
        }
        return win32.resolve(...paths);
    }

    private join(...paths: Array<string>): string {
        if (this.pathType === "posix") {
            return posix.join(...paths);
        }
        return win32.join(...paths);
    }

    private toPath(key: string): string {
        return this.normalize(
            this.join(
                this.resolve("/", this.location),
                this.keyPathMapper.toPath(key),
            ),
        );
    }

    private toDirectoryPath(key: string): string {
        return this.normalize(
            this.join(
                this.resolve("/", this.location),
                this.keyPathMapper.toDirectoryPath(key),
            ),
        );
    }

    async exists(key: string): Promise<boolean> {
        return await this.pool.run(async (client) => {
            const filePath = this.toPath(key);
            return (await client.exists(filePath)) !== false;
        });
    }

    async getStream(key: string): Promise<FileAdapterStream | null> {
        const filePath = this.toPath(key);
        const client = await this.pool.acquireOrFail();

        let isNotFound: boolean;
        try {
            const existsResult = await client.exists(filePath);
            isNotFound = existsResult === false;
        } catch (error: unknown) {
            await this.pool.release(client);
            throw error;
        }

        if (isNotFound) {
            await this.pool.release(client);
            return null;
        }

        const readStream = client.createReadStream(filePath);
        const cleanup = finished(readStream, () => {
            cleanup();
            void this.pool.release(client);
        });
        return readStream;
    }

    async getBytes(key: string): Promise<Uint8Array | null> {
        return await this.pool.run(async (client) => {
            try {
                const filePath = this.toPath(key);
                const file = await client.get(filePath);
                if (!(file instanceof Buffer)) {
                    throw UnexpectedError.create(
                        `SFTP get returned a non-buffer value for path "${filePath}"`,
                    );
                }
                return new Uint8Array(file);
            } catch (error: unknown) {
                const isFileNotFoundError =
                    error instanceof Error &&
                    error.message.startsWith("get: No such file");
                if (isFileNotFoundError) {
                    return null;
                }
                throw error;
            }
        });
    }

    private static toStats(fileStat: SftpClient.FileStats): etag.StatsLike {
        if (!Number.isFinite(fileStat.size) || fileStat.size < 0) {
            throw UnexpectedError.create(
                `SFTP stat size is invalid: ${String(fileStat.size)}`,
            );
        }
        if (!Number.isFinite(fileStat.modifyTime)) {
            throw UnexpectedError.create(
                `SFTP stat modifyTime is invalid: ${String(fileStat.modifyTime)}`,
            );
        }

        const mtime = new Date(fileStat.modifyTime);
        if (Number.isNaN(mtime.getTime())) {
            throw UnexpectedError.create(
                `SFTP stat modifyTime is invalid: ${String(fileStat.modifyTime)}`,
            );
        }

        return {
            ctime: mtime,
            mtime,
            ino: 0,
            size: fileStat.size,
        };
    }

    private static toFileMetadata(stat: etag.StatsLike): FileAdapterMetadata {
        return {
            etag: etag(stat),
            contentType: null,
            fileSizeInBytes: stat.size,
            updatedAt: stat.mtime,
        };
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        return await this.pool.run(async (client) => {
            try {
                const filePath = this.toPath(key);
                const sftpStat = await client.stat(filePath);
                const stats = SftpFileStorageAdapter.toStats(sftpStat);
                return SftpFileStorageAdapter.toFileMetadata(stats);
            } catch (error: unknown) {
                const isFileNotFoundError =
                    error instanceof Error &&
                    error.message.startsWith("_xstat: No such file");
                if (isFileNotFoundError) {
                    return null;
                }
                throw error;
            }
        });
    }

    async put(key: string, content: WritableFileAdapterContent): Promise<void> {
        await this.pool.run(async (client) => {
            await client.mkdir(this.toDirectoryPath(key), true);
            await client.put(Buffer.from(content.data), this.toPath(key));
        });
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<void> {
        await this.pool.run(async (client) => {
            await client.mkdir(this.toDirectoryPath(key), true);
            const writeStream = client.createWriteStream(this.toPath(key));
            await pipeline(Readable.from(stream.data), writeStream);
        });
    }

    // Removes sequentially, one at a time
    private async _removeMany(
        client: SftpClient,
        keys: Array<string>,
    ): Promise<void> {
        const paths = new Set(
            keys.map((key) => {
                return this.toPath(key);
            }),
        );
        for (const path of paths) {
            try {
                await client.delete(path);
            } catch (error: unknown) {
                const isFileNotFound =
                    error instanceof Error &&
                    error.message.startsWith("delete: No such file");
                if (isFileNotFound) {
                    continue;
                }
                throw error;
            }
        }
    }

    private async _copy(
        client: SftpClient,
        source: string,
        destination: string,
    ): Promise<boolean> {
        try {
            const sourceFilePath = this.toPath(source);
            const destinationFilePath = this.toPath(destination);
            const destinationDir = this.toDirectoryPath(destination);
            await client.mkdir(destinationDir, true);
            await client.rcopy(sourceFilePath, destinationFilePath);
            return true;
        } catch (error: unknown) {
            const isNotFound =
                error instanceof Error &&
                error.message.startsWith("rcopy: Source does not exist");

            if (isNotFound) {
                return false;
            }
            throw error;
        }
    }

    async copy(source: string, destination: string): Promise<boolean> {
        return await this.pool.run(async (client) => {
            await this._removeMany(client, [destination]);
            return await this._copy(client, source, destination);
        });
    }

    async move(source: string, destination: string): Promise<boolean> {
        return await this.pool.run(async (client) => {
            await this._removeMany(client, [destination]);
            const hasMoved = await this._copy(client, source, destination);
            if (hasMoved) {
                await this._removeMany(client, [source]);
            }
            return hasMoved;
        });
    }

    // Removes in parallel, multiple at a time
    async removeMany(keys: Array<string>): Promise<void> {
        const promises = keys.map((key) => {
            return this.pool.run(async (client) => {
                await this._removeMany(client, [key]);
            });
        });
        await Promise.all(promises);
    }

    async removeByPrefix(prefix: string): Promise<void> {
        await this.pool.run(async (client) => {
            const fileWalker = new SftpRecursiveFileWalker(
                client,
                this.resolve("/", this.location),
                (...args) => this.join(...args),
                (...args) => this.normalize(...args),
            );

            for await (const path of fileWalker) {
                if (
                    !this.keyPathMapper
                        .fromPath(
                            // On windows they left slashes \\, this.keyPathMapper.fromPath method expects left slashes
                            path.replaceAll(/\\/g, "/"),
                        )
                        .startsWith(this.join(this.location, prefix))
                ) {
                    continue;
                }

                try {
                    await client.delete(path);
                } catch (error: unknown) {
                    const isFileNotFound =
                        error instanceof Error &&
                        error.message.startsWith("delete: No such file");
                    if (isFileNotFound) {
                        continue;
                    }
                    throw error;
                }
            }
        });
    }
}
