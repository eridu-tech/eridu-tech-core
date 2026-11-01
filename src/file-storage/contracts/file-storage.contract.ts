/**
 * @module FileStorage
 */
import type { IFile } from "@/file-storage/contracts/file.contract.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type IFileFactory = {
    create(key: string): IFile;
};

/**
 * The `IFileStorage` contract defines a way for managing files independent of the underlying technology.
 * It commes with more convient methods compared to `IFileStorageAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/contracts"`
 * @group Contracts
 */
export type IFileStorage = IFileFactory & {
    /**
     * @throws {UnableToRemoveByPrefixFileError} If the file storage adapter fails with an unexpected error while removing the files
     */
    clear(): Promise<void>;

    /**
     * @throws {UnableToRemoveManyFileError} If the file storage adapter fails with an unexpected error while removing the files
     */
    removeMany(files: Array<IFile>): Promise<void>;
};
