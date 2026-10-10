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
    FileAdapterStream,
    FileWriteEnum,
    IFile,
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";

describe("class: FileStorage", () => {
    function createFileStorage() {
        const serde = new SuperJsonSerde();
        const fileStorage = new FileStorage({
            serde,
            adapter: new SignedFileStorageAdapter({
                adapter: new MemoryFileStorageAdapter(),
                urlAdapter: {},
            }),
        });
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
                getPublicUrl(key: string): Promise<string | null> {
                    return this.adapter.getPublicUrl(key);
                }
                getSignedDownloadUrl(
                    key: string,
                    settings: FileAdapterSignedDownloadUrlSettings,
                ): Promise<string | null> {
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
                getStream(key: string): Promise<FileAdapterStream | null> {
                    return this.adapter.getStream(key);
                }
                getBytes(key: string): Promise<Uint8Array | null> {
                    return this.adapter.getBytes(key);
                }
                getMetaData(key: string): Promise<FileAdapterMetadata | null> {
                    return this.adapter.getMetaData(key);
                }
                add(
                    key: string,
                    content: WritableFileAdapterContent,
                ): Promise<boolean> {
                    return this.adapter.add(key, content);
                }
                addStream(
                    key: string,
                    stream: WritableFileAdapterStream,
                ): Promise<boolean> {
                    return this.adapter.addStream(key, stream);
                }
                update(
                    key: string,
                    content: WritableFileAdapterContent,
                ): Promise<boolean> {
                    return this.adapter.update(key, content);
                }
                updateStream(
                    key: string,
                    stream: WritableFileAdapterStream,
                ): Promise<boolean> {
                    return this.adapter.updateStream(key, stream);
                }
                put(
                    key: string,
                    content: WritableFileAdapterContent,
                ): Promise<boolean> {
                    return this.adapter.put(key, content);
                }
                putStream(
                    key: string,
                    stream: WritableFileAdapterStream,
                ): Promise<boolean> {
                    return this.adapter.putStream(key, stream);
                }
                copy(
                    source: string,
                    destination: string,
                ): Promise<FileWriteEnum> {
                    return this.adapter.copy(source, destination);
                }
                copyAndReplace(
                    source: string,
                    destination: string,
                ): Promise<boolean> {
                    return this.adapter.copyAndReplace(source, destination);
                }
                move(
                    source: string,
                    destination: string,
                ): Promise<FileWriteEnum> {
                    return this.adapter.move(source, destination);
                }
                moveAndReplace(
                    source: string,
                    destination: string,
                ): Promise<boolean> {
                    return this.adapter.moveAndReplace(source, destination);
                }
                removeMany(keys: Array<string>): Promise<boolean> {
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
            const file1 = fileStorage1.create(key);
            const data1 = new Uint8Array(Buffer.from("CONTENT_1"));
            await file1.add({ data: data1 });

            class Adapter2 implements ISignedFileStorageAdapter {
                private readonly adapter: SignedFileStorageAdapter;
                constructor() {
                    this.adapter = new SignedFileStorageAdapter({
                        adapter: new MemoryFileStorageAdapter(),
                        urlAdapter: {},
                    });
                }
                getPublicUrl(key: string): Promise<string | null> {
                    return this.adapter.getPublicUrl(key);
                }
                getSignedDownloadUrl(
                    key: string,
                    settings: FileAdapterSignedDownloadUrlSettings,
                ): Promise<string | null> {
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
                getStream(key: string): Promise<FileAdapterStream | null> {
                    return this.adapter.getStream(key);
                }
                getBytes(key: string): Promise<Uint8Array | null> {
                    return this.adapter.getBytes(key);
                }
                getMetaData(key: string): Promise<FileAdapterMetadata | null> {
                    return this.adapter.getMetaData(key);
                }
                add(
                    key: string,
                    content: WritableFileAdapterContent,
                ): Promise<boolean> {
                    return this.adapter.add(key, content);
                }
                addStream(
                    key: string,
                    stream: WritableFileAdapterStream,
                ): Promise<boolean> {
                    return this.adapter.addStream(key, stream);
                }
                update(
                    key: string,
                    content: WritableFileAdapterContent,
                ): Promise<boolean> {
                    return this.adapter.update(key, content);
                }
                updateStream(
                    key: string,
                    stream: WritableFileAdapterStream,
                ): Promise<boolean> {
                    return this.adapter.updateStream(key, stream);
                }
                put(
                    key: string,
                    content: WritableFileAdapterContent,
                ): Promise<boolean> {
                    return this.adapter.put(key, content);
                }
                putStream(
                    key: string,
                    stream: WritableFileAdapterStream,
                ): Promise<boolean> {
                    return this.adapter.putStream(key, stream);
                }
                copy(
                    source: string,
                    destination: string,
                ): Promise<FileWriteEnum> {
                    return this.adapter.copy(source, destination);
                }
                copyAndReplace(
                    source: string,
                    destination: string,
                ): Promise<boolean> {
                    return this.adapter.copyAndReplace(source, destination);
                }
                move(
                    source: string,
                    destination: string,
                ): Promise<FileWriteEnum> {
                    return this.adapter.move(source, destination);
                }
                moveAndReplace(
                    source: string,
                    destination: string,
                ): Promise<boolean> {
                    return this.adapter.moveAndReplace(source, destination);
                }
                removeMany(keys: Array<string>): Promise<boolean> {
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

            const file2 = fileStorage2.create(key);
            const deserializeLock2 = await serde.deserialize<IFile>(
                await serde.serialize(file2),
            );
            const data2 = new Uint8Array(Buffer.from("CONTENT_2"));
            const result = await deserializeLock2.add({ data: data2 });

            expect(result).toBe(true);
        });
        test("Should differentiate between different serializationIds", async () => {
            const serde = new SuperJsonSerde();
            const key = "a";

            const lockProvider1 = new FileStorage({
                adapter: new SignedFileStorageAdapter({
                    adapter: new MemoryFileStorageAdapter(),
                    urlAdapter: {},
                }),
                serializationId: "adapter1",
                serde,
            });
            const lock1 = lockProvider1.create(key);
            const data1 = new Uint8Array(Buffer.from("CONTENT_1"));
            await lock1.add({ data: data1 });

            const lockProvider2 = new FileStorage({
                adapter: new SignedFileStorageAdapter({
                    adapter: new MemoryFileStorageAdapter(),
                    urlAdapter: {},
                }),
                serializationId: "adapter2",
                serde,
            });

            const lock2 = lockProvider2.create(key);
            const deserializeLock2 = await serde.deserialize<IFile>(
                await serde.serialize(lock2),
            );
            const data2 = new Uint8Array(Buffer.from("CONTENT_2"));
            const result = await deserializeLock2.add({ data: data2 });

            expect(result).toBe(true);
        });
    });
});
