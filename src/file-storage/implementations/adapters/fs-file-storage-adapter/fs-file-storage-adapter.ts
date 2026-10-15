/**
 * @module FileStorage
 */

import { createReadStream, createWriteStream } from "node:fs";
import {
    stat,
    writeFile,
    readFile,
    copyFile,
    mkdir,
    rm,
    constants,
    readdir,
    open,
} from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

import etag from "etag";

import { FILE_WRITE_ENUM } from "@/file-storage/contracts/_module-exports.js";

import type {
    FileAdapterMetadata,
    FileAdapterStream,
    FileWriteEnum,
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
     * @default
     * ```ts
     * import { fileURLToPath } from "node:url";
     *
     * fileURLToPath(new URL('./uploads', import.meta.url))
     * ```
     */
    location?: string;

    /**
     * @default "/"
     */
    delimiter?: string;
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
    private readonly delimiter: string;

    constructor(settings: FsFileStorageAdapterSettings = {}) {
        const {
            location = fileURLToPath(new URL("./uploads", import.meta.url)),
            delimiter = "/",
        } = settings;
        this.location = location;
        this.delimiter = delimiter;
    }

    /**
     * Creates the root foolder where the files will be saved.
     */
    async init(): Promise<void> {
        try {
            await mkdir(this.location);
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes the root foolder where the files are saved.
     */
    async deInit(): Promise<void> {
        try {
            await rm(this.location, {
                recursive: true,
            });
        } catch {
            /* EMPTY */
        }
    }

    private static isFileNotFoundError(error: unknown): boolean {
        return (
            error instanceof Error &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code === "ENOENT"
        );
    }

    private static isFileFoundError(error: unknown): boolean {
        return (
            error instanceof Error &&
            "code" in error &&
            typeof error.code === "string" &&
            error.code === "EEXIST"
        );
    }

    private static async isFileFound(key: string): Promise<boolean> {
        try {
            const fileStat = await stat(key);
            return fileStat.isFile();
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    private keyPath(key: string): string {
        return normalize(join(this.location, ...key.split(this.delimiter)));
    }

    async exists(key: string): Promise<boolean> {
        const keyPath = this.keyPath(key);
        return FsFileStorageAdapter.isFileFound(keyPath);
    }

    async getStream(key: string): Promise<FileAdapterStream | null> {
        const keyPath = this.keyPath(key);
        if (!(await FsFileStorageAdapter.isFileFound(keyPath))) {
            return null;
        }
        return createReadStream(keyPath);
    }

    async getBytes(key: string): Promise<Uint8Array | null> {
        try {
            const keyPath = this.keyPath(key);
            const file = await readFile(keyPath);
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
            const keyPath = this.keyPath(key);
            const pathStat = await stat(keyPath);
            return {
                etag: etag(pathStat),
                contentType: null,
                fileSizeInBytes: pathStat.size,
                updatedAt: pathStat.mtime,
            } satisfies FileAdapterMetadata;
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return null;
            }
            throw error;
        }
    }

    async add(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        try {
            const keyPath = this.keyPath(key);
            await mkdir(dirname(keyPath), {
                recursive: true,
            });
            await writeFile(keyPath, content.data, {
                flag: "wx",
            });
            return true;
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        try {
            const keyPath = this.keyPath(key);
            await mkdir(dirname(keyPath), {
                recursive: true,
            });
            const writeStream = createWriteStream(keyPath, {
                flags: "wx",
            });
            await pipeline(stream.data, writeStream);
            return true;
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async update(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        const keyPath = this.keyPath(key);
        let handle: Awaited<ReturnType<typeof open>>;

        // Open an existing file. Do not create a missing one.
        try {
            handle = await open(keyPath, "r+");
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }

            throw error;
        }

        try {
            // Remove the old contents.
            await handle.truncate(0);

            // Write the new contents starting at byte zero.
            await handle.writeFile(content.data);

            return true;
        } finally {
            await handle.close();
        }
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        const keyPath = this.keyPath(key);
        let handle: Awaited<ReturnType<typeof open>>;

        // Open an existing file without creating a missing one.
        try {
            handle = await open(keyPath, "r+");
        } catch (error: unknown) {
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }

            throw error;
        }

        try {
            // Remove all old contents.
            await handle.truncate(0);

            // Write from the beginning; retain ownership of the handle.
            const writeStream = handle.createWriteStream({
                start: 0,
                autoClose: true,
            });

            await pipeline(stream.data, writeStream);

            return true;
        } finally {
            await handle.close();
        }
    }

    async put(
        key: string,
        content: WritableFileAdapterContent,
    ): Promise<boolean> {
        const keyPath = this.keyPath(key);
        const isFound = await FsFileStorageAdapter.isFileFound(keyPath);
        await writeFile(keyPath, content.data);
        return isFound;
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        const keyPath = this.keyPath(key);
        const isFound = await FsFileStorageAdapter.isFileFound(keyPath);
        const writeStream = createWriteStream(keyPath);
        await pipeline(stream.data, writeStream);
        return isFound;
    }

    private async _copy(
        source: string,
        destination: string,
    ): Promise<FileWriteEnum> {
        try {
            const normalizeSource = this.keyPath(source);
            const normalizeDestination = this.keyPath(destination);
            await copyFile(
                normalizeSource,
                normalizeDestination,
                constants.COPYFILE_EXCL,
            );
            return FILE_WRITE_ENUM.SUCCESS;
        } catch (error: unknown) {
            // The source does not exists
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return FILE_WRITE_ENUM.NOT_FOUND;
            }
            // The destination does already exists
            if (FsFileStorageAdapter.isFileFoundError(error)) {
                return FILE_WRITE_ENUM.KEY_EXISTS;
            }
            throw error;
        }
    }

    async copy(source: string, destination: string): Promise<FileWriteEnum> {
        return this._copy(source, destination);
    }

    private async _copyAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        try {
            const normalizeSource = this.keyPath(source);
            const normalizeDestination = this.keyPath(destination);
            await copyFile(normalizeSource, normalizeDestination);
            return true;
        } catch (error: unknown) {
            // The source does not exists
            if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    async copyAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        return this._copyAndReplace(source, destination);
    }

    private async _removeMany(keys: Array<string>): Promise<boolean> {
        const promises = [
            ...new Set(
                keys.map((key) => {
                    return this.keyPath(key);
                }),
            ),
        ].map(async (keyPath) => {
            try {
                await rm(keyPath);
                return true;
            } catch (error: unknown) {
                if (FsFileStorageAdapter.isFileNotFoundError(error)) {
                    return false;
                }
                throw error;
            }
        });
        const results = await Promise.all(promises);
        for (const result of results) {
            if (result) {
                return true;
            }
        }
        return false;
    }

    async move(source: string, destination: string): Promise<FileWriteEnum> {
        const result = await this._copy(source, destination);
        if (result === FILE_WRITE_ENUM.SUCCESS) {
            await this._removeMany([source]);
        }
        return result;
    }

    async moveAndReplace(
        source: string,
        destination: string,
    ): Promise<boolean> {
        const hasMoved = await this.copyAndReplace(source, destination);
        if (hasMoved) {
            await this._removeMany([source]);
        }
        return hasMoved;
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        return this._removeMany(keys);
    }

    async removeByPrefix(prefix: string): Promise<void> {
        const paths = await readdir(normalize(this.location), {
            recursive: true,
        });
        for (const path of paths) {
            if (!path.startsWith(prefix)) {
                continue;
            }
            try {
                await rm(join(this.location, path), {
                    recursive: true,
                });
            } catch {
                /* EMPTY */
            }
        }
    }
}
