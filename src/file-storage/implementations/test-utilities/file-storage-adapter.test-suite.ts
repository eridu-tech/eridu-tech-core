/**
 * @module FileStorage
 */

import {
    isUint8ByteArrayEqualityTester,
    resolveStream,
} from "@/test-utilities/_module.js";

import type { beforeEach, ExpectStatic, SuiteAPI, TestAPI } from "vitest";

import type {
    FileAdapterMetadata,
    IFileStorageAdapter,
} from "@/file-storage/contracts/_module-exports.js";
import type { Promisable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/test-utilities"`
 * @group TestUtilities
 */
export type FileStorageAdapterTestSuiteSettings = {
    expect: ExpectStatic;
    test: TestAPI;
    describe: SuiteAPI;
    beforeEach: typeof beforeEach;
    createAdapter: () => Promisable<IFileStorageAdapter>;
    /**
     * @default true
     */
    enableGetMetaData?: boolean;
};

/**
 * The `fileStorageAdapterTestSuite` function simplifies the process of testing your custom implementation of {@link IFileStorageAdapter | `IFileStorageAdapter`} with `vitest`.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/test-utilities"`
 * @group TestUtilities
 */
export function fileStorageAdapterTestSuite(
    settings: FileStorageAdapterTestSuiteSettings,
): void {
    const {
        expect,
        test,
        createAdapter,
        describe,
        beforeEach: beforeEach_,
        enableGetMetaData = true,
    } = settings;
    let adapter: IFileStorageAdapter;
    beforeEach_(async () => {
        adapter = await createAdapter();
    });

    describe("IFileStorageAdapter tests:", () => {
        expect.addEqualityTesters([isUint8ByteArrayEqualityTester]);

        describe("method: exists", () => {
            test("Should return false when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.exists(noneExistingKey);

                expect(result).toBe(false);
            });
            test("Should return true when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.exists(key);

                expect(result).toBe(true);
            });
        });
        describe("method: getStream", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getStream(noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return AsyncIterable<Uint8Array> when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await resolveStream(
                    await adapter.getStream(key),
                );

                expect(result).toEqual(data);
            });
        });
        describe("method: getBytes", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getBytes(noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return Uint8Array when key exists", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getBytes(key);

                expect(result).toEqual(data);
            });
        });
        describe.skipIf(!enableGetMetaData)("method: getMetaData", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter.getMetaData(noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return initial metadata with a null updatedAt after add method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return initial metadata with a null updatedAt after put method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after add method followed by update method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.put(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after put method followed by update method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.put(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after put overwrites an existing file", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.put(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return initial metadata with a null updatedAt after putStream method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return initial metadata with a null updatedAt after putStream method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after putStream method followed by putStream method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after putStream method followed by putStream method", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return metadata with a valid updatedAt after putStream overwrites an existing file", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "text/plain";
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newContentType = "application/octet-stream";
                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: newContentType,
                    fileSizeInBytes: newData.length,
                });
                const result = await adapter.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: newContentType,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
        });
        describe("method: put", () => {
            test("Should persist data when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(data);
            });
            test("Should persist data when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.put(key, {
                    data: newData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: putStream", () => {
            test("Should persist data when key doesnt exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(data);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(data);
            });
            test("Should persist data when key exist", async () => {
                const key = "a";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const newData = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                await adapter.putStream(key, {
                    data: {
                        async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                            yield Promise.resolve(newData);
                        },
                    },
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.getBytes(key);
                expect(result).toEqual(newData);
            });
        });
        describe("method: copy", () => {
            test("Should return false when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.copy(
                    noneExistingSource,
                    noneExistingDestination,
                );

                expect(result).toBe(false);
            });
            test("Should return false when source does not exists and destination exists", async () => {
                const noneExistingSource = "a";

                const destination = "c";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.copy(
                    noneExistingSource,
                    destination,
                );

                expect(result).toBe(false);
            });
            test("Should return true when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.put(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.copy(source, destination);

                expect(result).toBe(true);
            });
            test("Should persist when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.put(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.copy(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
            test("Should return true when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const result = await adapter.copy(source, destination);

                expect(result).toBe(true);
            });
            test("Should persist data when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.copy(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
        });
        describe("method: move", () => {
            test("Should return false when source does not exists and destination does not exists", async () => {
                const noneExistingSource = "a";
                const noneExistingDestination = "c";

                const result = await adapter.move(
                    noneExistingSource,
                    noneExistingDestination,
                );

                expect(result).toBe(false);
            });
            test("Should return false when source does not exists and destination exists", async () => {
                const noneExistingSource = "a";

                const destination = "c";
                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put(destination, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });

                const result = await adapter.move(
                    noneExistingSource,
                    destination,
                );

                expect(result).toBe(false);
            });
            test("Should return true when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.put(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                const result = await adapter.move(source, destination);

                expect(result).toBe(true);
            });
            test("Should persist when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.put(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.move(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
            test("Should remove source when source exists and destination exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const destinationData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                await adapter.put(destination, {
                    data: destinationData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: destinationData.length,
                });

                await adapter.move(source, destination);

                const result = await adapter.getBytes(source);
                expect(result).toBeNull();
            });
            test("Should return true when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                const result = await adapter.move(source, destination);

                expect(result).toBe(true);
            });
            test("Should persist data when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.move(source, destination);

                const result = await adapter.getBytes(destination);
                expect(result).toEqual(sourceData);
            });
            test("Should remove source when source exists and destination does not exists", async () => {
                const source = "a";
                const sourceData = new Uint8Array(
                    Buffer.from("CONTENT", "utf8"),
                );
                const contentType = "application/octet-stream";
                await adapter.put(source, {
                    data: sourceData,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: sourceData.length,
                });

                const destination = "c";
                await adapter.move(source, destination);

                const result = await adapter.getBytes(source);
                expect(result).toBeNull();
            });
        });
        describe("method: removeMany", () => {
            test("Should persist removal of the keys that exists", async () => {
                const data1 = new Uint8Array(Buffer.from("CONTENT_A", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put("a", {
                    data: data1,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data1.length,
                });

                const data2 = new Uint8Array(Buffer.from("CONTENT_B", "utf8"));
                await adapter.put("b", {
                    data: data2,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data2.length,
                });

                const data3 = new Uint8Array(Buffer.from("CONTENT_C", "utf8"));
                await adapter.put("c", {
                    data: data3,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data3.length,
                });

                await adapter.removeMany(["a", "b"]);

                const result = [
                    await adapter.getBytes("a"),
                    await adapter.getBytes("b"),
                    await adapter.getBytes("c"),
                ];
                expect(result).toEqual([null, null, data3]);
            });
        });
        describe("method: removeByPrefix", () => {
            test(`Should remove all keys that start with prefix "file-storage"`, async () => {
                const dataA = new Uint8Array(Buffer.from("CONTENT_A", "utf8"));
                const contentType = "application/octet-stream";
                await adapter.put("file-storage/a", {
                    data: dataA,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataA.length,
                });

                const dataB = new Uint8Array(Buffer.from("CONTENT_B", "utf8"));
                await adapter.put("file-storage/b", {
                    data: dataB,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataB.length,
                });

                const dataC = new Uint8Array(Buffer.from("CONTENT_C", "utf8"));
                await adapter.put("c", {
                    data: dataC,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: dataC.length,
                });

                await adapter.removeByPrefix("file-storage");

                const result = [
                    await adapter.getBytes("file-storage/a"),
                    await adapter.getBytes("file-storage/b"),
                    await adapter.getBytes("c"),
                ];
                expect(result).toEqual([null, null, dataC]);
            });
        });
    });
}
