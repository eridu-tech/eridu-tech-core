import { GenericContainer, Wait } from "testcontainers";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createClient } from "webdav";

import { WebdavFileStorageAdapter } from "@/file-storage/implementations/adapters/webdav-file-storage-adapter/webdav-file-storage-adapter.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedTestContainer } from "testcontainers";
import type { WebDAVClient } from "webdav";

import type { FileAdapterMetadata } from "@/file-storage/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);

const WEBDAV_IMAGE = "hacdias/webdav:v5.17.1";
const WEBDAV_PORT = 6065;
const USERNAME = "eridu";
const PASSWORD = "eridu";

// hacdias/webdav only reads its configuration from a file, so it is copied
// into the scratch-based image before the container starts.
const WEBDAV_CONFIG = `
address: 0.0.0.0
port: ${String(WEBDAV_PORT)}
directory: /data
permissions: CRUD
users:
  - username: ${USERNAME}
    password: ${PASSWORD}
`;

describe("class: WebdavFileStorageAdapter", () => {
    let client: WebDAVClient;
    let adapter_: WebdavFileStorageAdapter;
    let startedContainer: StartedTestContainer;
    beforeEach(async () => {
        startedContainer = await new GenericContainer(WEBDAV_IMAGE)
            .withCopyContentToContainer([
                { content: WEBDAV_CONFIG, target: "/config.yml" },
            ])
            .withTmpFs({ "/data": "rw" })
            .withExposedPorts(WEBDAV_PORT)
            .withCommand(["-c", "/config.yml"])
            .withWaitStrategy(
                Wait.forHttp("/", WEBDAV_PORT)
                    .withBasicCredentials(USERNAME, PASSWORD)
                    .forStatusCodeMatching((statusCode) => {
                        return statusCode >= 200 && statusCode < 300;
                    })
                    .withStartupTimeout(timeout.toMilliseconds()),
            )
            .start();
        client = createClient(
            `http://${startedContainer.getHost()}:${String(startedContainer.getMappedPort(WEBDAV_PORT))}`,
            {
                username: USERNAME,
                password: PASSWORD,
            },
        );
        adapter_ = new WebdavFileStorageAdapter({ client });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await startedContainer.stop();
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
});
