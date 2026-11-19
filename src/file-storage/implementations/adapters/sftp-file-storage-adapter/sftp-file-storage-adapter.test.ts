import { randomUUID } from "node:crypto";

import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";

import { SftpFileStorageAdapter } from "@/file-storage/implementations/adapters/sftp-file-storage-adapter/sftp-file-storage-adapter.js";
import { sftpPool } from "@/file-storage/implementations/adapters/sftp-file-storage-adapter/sftp-pool.js";
import { withFileStoragePrefix } from "@/file-storage/implementations/plugins/_module-exports.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { QueuePool } from "@/generic-pool/implementations/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { SftpServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type SftpClient from "ssh2-sftp-client";

import type { FileAdapterMetadata } from "@/file-storage/contracts/_module-exports.js";
import type { IGenericPool } from "@/generic-pool/contracts/generic-pool.contract.js";

const timeout = TimeSpan.fromMinutes(2);

describe(
    "class: SftpFileStorageAdapter",
    {
        timeout: TimeSpan.fromSeconds(10).toMilliseconds(),
    },
    () => {
        let pool: IGenericPool<SftpClient>;
        let adapter_: SftpFileStorageAdapter;
        const sftpServer = new SftpServer();
        beforeAll(async () => {
            await sftpServer.init();

            pool = sftpPool({
                name: "sftp-file-storage-adapter",
                connectionSettings: sftpServer.getConnectionSettings(),
                poolFactory: (resourceFactory) => {
                    return new QueuePool(resourceFactory, {
                        maxResources: 5,
                    });
                },
            });
        }, timeout.toMilliseconds());
        beforeEach(() => {
            adapter_ = withPlugin(
                new SftpFileStorageAdapter({
                    pool,
                    location: sftpServer.getHomeDirectory(),
                }),
                withFileStoragePrefix(randomUUID()),
            );
            vi.clearAllMocks();
            vi.resetAllMocks();
        });
        afterAll(async () => {
            await pool.close();
            await sftpServer.deInit();
        }, timeout.toMilliseconds());
        fileStorageAdapterTestSuite({
            createAdapter: () => adapter_,
            test,
            beforeEach,
            expect,
            describe,
            enableGetMetaData: false,
        });
        describe("method: getStream", () => {
            const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));

            async function putFile(key: string): Promise<void> {
                await adapter_.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType: "text/plain",
                    fileSizeInBytes: data.length,
                });
            }

            async function getStreamOrThrow(
                key: string,
            ): Promise<AsyncIterable<Uint8Array>> {
                const stream = await adapter_.getStream(key);
                if (stream === null) {
                    throw new Error("Expected a stream but got null");
                }
                return stream;
            }

            test("Should acquire exactly one client for a consumed stream", async () => {
                const key = "a";
                await putFile(key);
                const acquireSpy = vi.spyOn(pool, "acquireOrFail");

                const stream = await getStreamOrThrow(key);
                for await (const _chunk of stream) {
                    // consume everything
                }

                expect(acquireSpy).toHaveBeenCalledOnce();
            });
            test("Should acquire exactly one client when the consumer stops iterating early", async () => {
                const key = "a";
                await putFile(key);
                const acquireSpy = vi.spyOn(pool, "acquireOrFail");

                const stream = await getStreamOrThrow(key);
                for await (const _chunk of stream) {
                    break;
                }

                expect(acquireSpy).toHaveBeenCalledTimes(2);
            });
            test("Should acquire exactly one client when the key does not exists", async () => {
                const acquireSpy = vi.spyOn(pool, "acquireOrFail");

                const result = await adapter_.getStream("a");

                expect(result).toBeNull();
                expect(acquireSpy).toHaveBeenCalledOnce();
            });
        });
        describe("method: getMetadata", () => {
            test("Should return null when key does not exists", async () => {
                const noneExistingKey = "a";

                const result = await adapter_.getMetaData(noneExistingKey);

                expect(result).toBeNull();
            });
            test("Should return content-type null when file name contains json extension", async () => {
                const key = "a.json";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/json";
                await adapter_.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter_.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: null,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return content-type null when file name contains txt extension", async () => {
                const key = "a.txt";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/json";
                await adapter_.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter_.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: null,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
            test("Should return content-type null when file name contains unknown extension", async () => {
                const key = "a.unknown";

                const data = new Uint8Array(Buffer.from("CONTENT", "utf8"));
                const contentType = "application/json";
                await adapter_.put(key, {
                    data,
                    cacheControl: null,
                    contentDisposition: null,
                    contentEncoding: null,
                    contentLanguage: null,
                    contentType,
                    fileSizeInBytes: data.length,
                });
                const result = await adapter_.getMetaData(key);

                expect(result).toEqual({
                    etag: expect.any(String) as string,
                    contentType: null,
                    fileSizeInBytes: data.byteLength,
                    updatedAt: expect.any(Date) as Date,
                } satisfies FileAdapterMetadata);
            });
        });
    },
);
