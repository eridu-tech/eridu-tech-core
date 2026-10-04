/**
 * @module FileStorage
 */
import { isBytesArrayEqualityTester } from "@/test-utilities/_module.js";

import type { beforeEach, ExpectStatic, SuiteAPI, TestAPI } from "vitest";

import type {
    IFile,
    IFileStorage,
} from "@/file-storage/contracts/_module-exports.js";
import type { ISerde } from "@/serde/contracts/_module-exports.js";
import type { Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/test-utilities"`
 * @group TestUtilities
 */
export type FileStorageSerdeTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createFileStorage: () => Promisable<{
        fileStorage: IFileStorage;
        serde: ISerde;
    }>;
};

/**
 * The `fileStorageSerdeTestSuite` function simplifies the process of testing the serde behavior of your custom implementation of {@link IFileStorage | `IFileStorage`} with `vitest`.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/test-utilities"`
 * @group TestUtilities
 */
export function fileStorageSerdeTestSuite(
    settings: FileStorageSerdeTestSuiteSettings,
): void {
    const {
        expect,
        test,
        describe,
        createFileStorage,
        beforeEach: beforeEach_,
    } = settings;

    let fileStorage: IFileStorage;
    let serde: ISerde;

    describe("IFileStorage serde tests:", () => {
        expect.addEqualityTesters([isBytesArrayEqualityTester]);
        beforeEach_(async () => {
            const { fileStorage: fileStorage_, serde: serde_ } =
                await createFileStorage();
            fileStorage = fileStorage_;
            serde = serde_;
        });
        test("Should allow get data from a deserialized file instance", async () => {
            const file = fileStorage.create("a.txt");
            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            await file.add({ data });
            const deserializedFile = serde.deserialize<IFile>(
                serde.serialize(file),
            );

            const retrievedData = await deserializedFile.getBytes();

            expect(retrievedData).toEqual(data);
        });
        test("Should allow update data on a deserialized file instance", async () => {
            const file = fileStorage.create("a.txt");
            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            await file.add({ data });
            const deserializedFile = serde.deserialize<IFile>(
                serde.serialize(file),
            );

            const newData = new Uint8Array(Buffer.from("NEW_CONTENT", "utf8"));
            await deserializedFile.update({
                data: newData,
            });
            const retrievedData = await deserializedFile.getBytes();

            expect(retrievedData).toEqual(newData);
        });
        test("Should allow put data on a deserialized file instance", async () => {
            const file = fileStorage.create("a.txt");
            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            await file.add({ data });
            const deserializedFile = serde.deserialize<IFile>(
                serde.serialize(file),
            );

            const newData = new Uint8Array(Buffer.from("NEW_CONTENT", "utf8"));
            await deserializedFile.put({
                data: newData,
            });
            const retrievedData = await deserializedFile.getBytes();

            expect(retrievedData).toEqual(newData);
        });
        test("Should allow remove data on a deserialized file instance", async () => {
            const file = fileStorage.create("a.txt");
            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
            await file.add({ data });
            const deserializedFile = serde.deserialize<IFile>(
                serde.serialize(file),
            );

            await deserializedFile.remove();
            const retrievedData = await deserializedFile.getBytes();

            expect(retrievedData).toBeNull();
        });
    });
}
