import { randomUUID } from "node:crypto";

import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
} from "vitest";
import { createClient } from "webdav";

import { WebdavFileStorageAdapter } from "@/file-storage/implementations/adapters/webdav-file-storage-adapter/webdav-file-storage-adapter.js";
import { withFileStoragePrefix } from "@/file-storage/implementations/plugins/_module-exports.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { WebdavServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { WebDAVClient } from "webdav";

import type { FileAdapterMetadata } from "@/file-storage/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);

describe(
    "class: WebdavFileStorageAdapter",
    { tags: ["WebDAV", "Adapters", "Implementations", "FileStorage"] },
    () => {
        let client: WebDAVClient;
        let adapter_: WebdavFileStorageAdapter;
        const webdavServer = new WebdavServer();
        beforeAll(async () => {
            await webdavServer.init();
            const { url, username, password } = webdavServer.getSettings();
            client = createClient(url, {
                username,
                password,
            });
        }, timeout.toMilliseconds());
        beforeEach(() => {
            adapter_ = withPlugin(
                new WebdavFileStorageAdapter({ client }),
                withFileStoragePrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            await webdavServer.deInit();
        }, timeout.toMilliseconds());
        fileStorageAdapterTestSuite({
            createAdapter: () => adapter_,
            test,
            beforeEach,
            expect,
            describe,
            enableGetMetaData: false,
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
