/* eslint-disable no-shadow */
import { beforeEach, describe, expect, test } from "vitest";

import { MemoryFileStorageAdapter } from "@/file-storage/implementations/adapters/memory-file-storage-adapter/_module-exports.js";
import { SignedFileStorageAdapter } from "@/file-storage/implementations/adapters/signed-file-storage-adapter/_module-exports.js";
import { FileStorage } from "@/file-storage/implementations/derivables/file-storage/file-storage.js";
import {
    fileStorageSerdeTestSuite,
    fileStorageTestSuite,
} from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";

import type {
    FileAdapterMetadata,
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterSignedUploadUrlSettings,
    IFile,
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";
import type { Bytes, ByteStream } from "@/utilities/_module-exports.js";

describe("class: FileStorage", () => {
    async function createFileStorage() {
        const serde = new SuperJsonSerde();
        const fileStorage = new FileStorage({
            serde,
            adapter: new SignedFileStorageAdapter({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {},
            }),
        });
        await fileStorage.init();
        return {
            fileStorage,
            serde,
        };
    }

    fileStorageTestSuite({
        createFileStorage,
        beforeEach,
        describe,
        expect,
        test,
    });

    fileStorageSerdeTestSuite({
        createFileStorage,
        beforeEach,
        describe,
        expect,
        test,
    });

    describe("Serde tests:", () => {
        test("Should differentiate between different adapters", async () => {
            const serde = new SuperJsonSerde();
            const key = "a";

            class Adapter1 implements ISignedFileStorageAdapter {
                private readonly adapter: SignedFileStorageAdapter;
                constructor() {
                    this.adapter = new SignedFileStorageAdapter({
                        adapter: new MemoryFileStorageAdapter(),
                        urlAdapter: {},
                    });
                }
                getPublicUrl(key: string): Promise<string> {
                    return this.adapter.getPublicUrl(key);
                }
                getSignedDownloadUrl(
                    key: string,
                    settings: FileAdapterSignedDownloadUrlSettings,
                ): Promise<string> {
                    return this.adapter.getSignedDownloadUrl(key, settings);
                }
                getSignedUploadUrl(
                    key: string,
                    settings: FileAdapterSignedUploadUrlSettings,
                ): Promise<string> {
                    return this.adapter.getSignedUploadUrl(key, settings);
                }
                exists(key: string): Promise<boolean> {
                    return this.adapter.exists(key);
                }
                getStream(key: string): Promise<ByteStream | null> {
                    return this.adapter.getStream(key);
                }
                getBytes(key: string): Promise<Bytes | null> {
                    return this.adapter.getBytes(key);
                }
                getMetaData(key: string): Promise<FileAdapterMetadata | null> {
                    return this.adapter.getMetaData(key);
                }
                put(
                    key: string,
                    content: WritableFileAdapterContent,
                ): Promise<void> {
                    return this.adapter.put(key, content);
                }
                putStream(
                    key: string,
                    stream: WritableFileAdapterStream,
                ): Promise<void> {
                    return this.adapter.putStream(key, stream);
                }
                copy(source: string, destination: string): Promise<boolean> {
                    return this.adapter.copy(source, destination);
                }
                move(source: string, destination: string): Promise<boolean> {
                    return this.adapter.move(source, destination);
                }
                removeMany(keys: Array<string>): Promise<void> {
                    return this.adapter.removeMany(keys);
                }
                removeByPrefix(prefix: string): Promise<void> {
                    return this.adapter.removeByPrefix(prefix);
                }
            }
            const adapter1 = new Adapter1();
            const fileStorage1 = new FileStorage({
                adapter: adapter1,
                serde,
            });
            await fileStorage1.init();
            const file1 = fileStorage1.create(key);

            const data1 = new Uint8Array(Buffer.from("CONTENT_1"));
            await file1.put({ data: data1 });

            class Adapter2 implements ISignedFileStorageAdapter {
                private readonly adapter: SignedFileStorageAdapter;
                constructor() {
                    this.adapter = new SignedFileStorageAdapter({
                        adapter: new MemoryFileStorageAdapter(),
                        urlAdapter: {},
                    });
                }
                getPublicUrl(key: string): Promise<string> {
                    return this.adapter.getPublicUrl(key);
                }
                getSignedDownloadUrl(
                    key: string,
                    settings: FileAdapterSignedDownloadUrlSettings,
                ): Promise<string> {
                    return this.adapter.getSignedDownloadUrl(key, settings);
                }
                getSignedUploadUrl(
                    key: string,
                    settings: FileAdapterSignedUploadUrlSettings,
                ): Promise<string> {
                    return this.adapter.getSignedUploadUrl(key, settings);
                }
                exists(key: string): Promise<boolean> {
                    return this.adapter.exists(key);
                }
                getStream(key: string): Promise<ByteStream | null> {
                    return this.adapter.getStream(key);
                }
                getBytes(key: string): Promise<Bytes | null> {
                    return this.adapter.getBytes(key);
                }
                getMetaData(key: string): Promise<FileAdapterMetadata | null> {
                    return this.adapter.getMetaData(key);
                }
                put(
                    key: string,
                    content: WritableFileAdapterContent,
                ): Promise<void> {
                    return this.adapter.put(key, content);
                }
                putStream(
                    key: string,
                    stream: WritableFileAdapterStream,
                ): Promise<void> {
                    return this.adapter.putStream(key, stream);
                }
                copy(source: string, destination: string): Promise<boolean> {
                    return this.adapter.copy(source, destination);
                }
                move(source: string, destination: string): Promise<boolean> {
                    return this.adapter.move(source, destination);
                }
                removeMany(keys: Array<string>): Promise<void> {
                    return this.adapter.removeMany(keys);
                }
                removeByPrefix(prefix: string): Promise<void> {
                    return this.adapter.removeByPrefix(prefix);
                }
            }
            const adapter2 = new Adapter2();
            const fileStorage2 = new FileStorage({
                adapter: adapter2,
                serde,
            });
            await fileStorage2.init();
            const file2 = fileStorage2.create(key);

            const deserializeFile2 = await serde.deserialize<IFile>(
                await serde.serialize(file2),
            );
            const data2 = new Uint8Array(Buffer.from("CONTENT_2"));
            await deserializeFile2.put({ data: data2 });
            const result = await deserializeFile2.exists();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serializationIds", async () => {
            const serde = new SuperJsonSerde();
            const key = "a";

            const fileStorage1 = new FileStorage({
                adapter: new SignedFileStorageAdapter({
                    adapter: new MemoryFileStorageAdapter(),
                    urlAdapter: {},
                }),
                serializationId: "adapter1",
                serde,
            });
            await fileStorage1.init();
            const file1 = fileStorage1.create(key);

            const data1 = new Uint8Array(Buffer.from("CONTENT_1"));
            await file1.put({ data: data1 });

            const fileStorage2 = new FileStorage({
                adapter: new SignedFileStorageAdapter({
                    adapter: new MemoryFileStorageAdapter(),
                    urlAdapter: {},
                }),
                serializationId: "adapter2",
                serde,
            });
            await fileStorage2.init();
            const file2 = fileStorage2.create(key);

            const deserializeFile2 = await serde.deserialize<IFile>(
                await serde.serialize(file2),
            );
            const data2 = new Uint8Array(Buffer.from("CONTENT_2"));
            await deserializeFile2.put({ data: data2 });
            const result = await deserializeFile2.exists();

            expect(result).toBe(true);
        });
    });
});
