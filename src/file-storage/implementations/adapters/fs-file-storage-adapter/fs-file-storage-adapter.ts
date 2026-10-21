/**
 * @module FileStorage
 */

import { createReadStream, createWriteStream, statSync } from "node:fs";
import {
    stat,
    writeFile,
    readFile,
    copyFile,
    mkdir,
    rm,
    readdir,
} from "node:fs/promises";
import { join, normalize } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

import etag from "etag";

import { Base64UrlCodec } from "@/codec/implementations/base-64-url-codec/_module-exports.js";
import { FsKeyPathMapper } from "@/file-storage/implementations/adapters/_shared/_module.js";

import type { ICodec } from "@/codec/contracts/_module-exports.js";
import type {
    FileAdapterMetadata,
    FileAdapterStream,
    IFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";
import type {
    IDeinitizable,
    IInitizable,
} from "@/utilities/_module-exports.js";

/**
 * Configuration for `FsFileStorageAdapter`.
 * Provides local filesystem-based file storage.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/fs-file-storage-adapter"`
 * @group Adapters
 */
export type FsFileStorageAdapterSettings = {
    /**
     * Root folder where all files are stored.
     *
     * @default
     * ```ts
     * import { fileURLToPath } from "node:url";
     *
     * fileURLToPath(new URL('./uploads', import.meta.url))
     * ```
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
 * The `FsFileStorageAdapter` is used for local development when persistence is needed when restarting the dev server.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/fs-file-storage-adapter"`
 * @group Adapters
 */
export class FsFileStorageAdapter
    implements IFileStorageAdapter, IDeinitizable, IInitizable
{
    private readonly location: string;
    private readonly keyPathMapper: FsKeyPathMapper;

    constructor(settings: FsFileStorageAdapterSettings) {
        const {
            location = fileURLToPath(new URL("./uploads", import.meta.url)),
            delimiter = "/",
            codec = new Base64UrlCodec(),
        } = settings;
        this.location = location;
        this.keyPathMapper = new FsKeyPathMapper(delimiter, codec);
    }

    /**
     * Creates the root foolder where the files will be saved.
     */
    async init(): Promise<void> {
        const dirStat = statSync(this.location, {
            throwIfNoEntry: false,
        });
        if (dirStat?.isDirectory() === true) {
            return;
        }

        await mkdir(this.location);
    }

    /**
     * Removes the root foolder where the files are saved.
     */
    async deInit(): Promise<void> {
        const dirStat = statSync(this.location, {
            throwIfNoEntry: false,
        });
        if (dirStat?.isDirectory() !== true) {
            return;
        }

        await rm(this.location, {
            recursive: true,
        });
    }

    private static isFileNotFoundError(error: unknown): boolean {
        return (
            error instanceof Error &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code === "ENOENT"
        );
    }

    private static async isFileFound(path: string): Promise<boolean> {
        try {
            const fileStat = await stat(path);
            return fileStat.isFile();
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    private toPath(key: string): string {
        return normalize(join(this.location, this.keyPathMapper.toPath(key)));
    }

    private toDirectoryPath(key: string): string {
        return normalize(
            join(this.location, this.keyPathMapper.toDirectoryPath(key)),
        );
    }

    async exists(key: string): Promise<boolean> {
        const path = this.toPath(key);
        return FsFileStorageAdapter.isFileFound(path);
    }

    async getStream(key: string): Promise<FileAdapterStream | null> {
        const path = this.toPath(key);
        if (!(await FsFileStorageAdapter.isFileFound(path))) {
            return null;
        }
        return createReadStream(path);
    }

    async getBytes(key: string): Promise<Uint8Array | null> {
        try {
            const path = this.toPath(key);
            const file = await readFile(path);
            return new Uint8Array(file);
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return null;
            }
            throw error;
        }
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        try {
            const path = this.toPath(key);
            const pathStat = await stat(path);
            return {
                etag: etag(pathStat),
                contentType: null,
                fileSizeInBytes: pathStat.size,
                updatedAt: pathStat.mtime,
            };
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return null;
            }
            throw error;
        }
    }

    async put(key: string, content: WritableFileAdapterContent): Promise<void> {
        const path = this.toPath(key);
        await mkdir(this.toDirectoryPath(key), {
            recursive: true,
        });
        await writeFile(path, content.data);
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<void> {
        const path = this.toPath(key);
        await mkdir(this.toDirectoryPath(key), {
            recursive: true,
        });
        const writeStream = createWriteStream(path);
        await pipeline(stream.data, writeStream);
    }

    private async _copy(source: string, destination: string): Promise<boolean> {
        try {
            const sourcePath = this.toPath(source);
            const destinationPath = this.toPath(destination);
            await mkdir(this.toDirectoryPath(destination), {
                recursive: true,
            });
            await copyFile(sourcePath, destinationPath);
            return true;
        } catch (error: unknown) {
            // The source does not exists
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async copy(source: string, destination: string): Promise<boolean> {
        return this._copy(source, destination);
    }

    private async _removeMany(keys: Array<string>): Promise<void> {
        const promises = [
            ...new Set(
                keys.map((key) => {
                    return this.toPath(key);
                }),
            ),
        ].map(async (path) => {
            try {
                await rm(path);
                return true;
            } catch (error: unknown) {
                if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                    return false;
                }
                throw error;
            }
        });
        await Promise.all(promises);
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

    async removeByPrefix(prefix: string): Promise<void> {
        if (prefix === "") {
            await rm(normalize(this.location), {
                recursive: true,
            });

            return;
        }

        const paths = await readdir(normalize(this.location), {
            recursive: true,
        });

        for (const path of paths) {
            if (
                !this.keyPathMapper
                    .fromPath(
                        // On windows they left slashes \\, this.keyPathMapper.fromPath method expects left slashes
                        path.replaceAll(/\\/g, "/"),
                    )
                    .startsWith(prefix)
            ) {
                continue;
            }
            try {
                await rm(join(this.location, path), {
                    recursive: true,
                });
            } catch (error: unknown) {
                if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                    continue;
                }
                throw error;
            }
        }
    }
}
