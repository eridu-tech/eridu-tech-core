import { GenericContainer, Wait } from "testcontainers";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { SftpFileStorageAdapter } from "@/file-storage/implementations/adapters/sftp-file-storage-adapter/sftp-file-storage-adapter.js";
import { sftpPool } from "@/file-storage/implementations/adapters/sftp-file-storage-adapter/sftp-pool.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type SftpClient from "ssh2-sftp-client";
import type { StartedTestContainer } from "testcontainers";

import type { FileAdapterMetadata } from "@/file-storage/contracts/_module-exports.js";
import type { IGenericPool } from "@/generic-pool/contracts/generic-pool.contract.js";

const timeout = TimeSpan.fromMinutes(2);

const SFTP_IMAGE = "atmoz/sftp";
const SFTP_PORT = 22;
const USERNAME = "eridu";
const PASSWORD = "eridu";

describe("class: SftpFileStorageAdapter", () => {
    let pool: IGenericPool<SftpClient>;
    let adapter_: SftpFileStorageAdapter;
    let startedContainer: StartedTestContainer;
    beforeEach(async () => {
        startedContainer = await new GenericContainer(SFTP_IMAGE)
            .withExposedPorts(SFTP_PORT)
            .withCommand([`${USERNAME}:${PASSWORD}:::upload`])
            .withWaitStrategy(
                Wait.forListeningPorts().withStartupTimeout(
                    timeout.toMilliseconds(),
                ),
            )
            .start();

        pool = sftpPool({
            name: "sftp-file-storage-adapter",
            connectionSettings: {
                host: startedContainer.getHost(),
                port: startedContainer.getMappedPort(SFTP_PORT),
                username: USERNAME,
                password: PASSWORD,
            },
        });
        adapter_ = new SftpFileStorageAdapter({
            pool,
            location: "/upload",
        });
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
