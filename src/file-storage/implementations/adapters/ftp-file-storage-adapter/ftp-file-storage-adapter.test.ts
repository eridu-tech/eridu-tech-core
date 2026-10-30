import { GenericContainer, Wait } from "testcontainers";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { FtpFileStorageAdapter } from "@/file-storage/implementations/adapters/ftp-file-storage-adapter/ftp-file-storage-adapter.js";
import { ftpPool } from "@/file-storage/implementations/adapters/ftp-file-storage-adapter/ftp-pool.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { AccessOptions, Client } from "basic-ftp";
import type { StartedTestContainer } from "testcontainers";

import type { FileAdapterMetadata } from "@/file-storage/contracts/_module-exports.js";
import type { IGenericPool } from "@/generic-pool/contracts/generic-pool.contract.js";

const timeout = TimeSpan.fromMinutes(2);

const FTP_IMAGE = "stilliard/pure-ftpd:hardened";
const FTP_PORT = 21;
// Passive ports are published 1:1 on the host, so each FTP test file needs its own range.
const PASSIVE_PORT_START = 32010;
const PASSIVE_PORT_END = 32019;
const PASSIVE_PORTS = Array.from(
    { length: PASSIVE_PORT_END - PASSIVE_PORT_START + 1 },
    (_, index) => PASSIVE_PORT_START + index,
);
const USERNAME = "eridu";
const PASSWORD = "eridu";

describe("class: FtpFileStorageAdapter", () => {
    let pool: IGenericPool<Client>;
    let adapter_: FtpFileStorageAdapter;
    let startedContainer: StartedTestContainer;
    beforeEach(async () => {
        startedContainer = await new GenericContainer(FTP_IMAGE)
            // The server advertises the passive ports itself, so they must be published 1:1.
            .withExposedPorts(
                FTP_PORT,
                ...PASSIVE_PORTS.map((port) => ({
                    container: port,
                    host: port,
                })),
            )
            .withEnvironment({
                FTP_USER_NAME: USERNAME,
                FTP_USER_PASS: PASSWORD,
                FTP_USER_HOME: `/home/ftpusers/${USERNAME}`,
                FTP_PASSIVE_PORTS: [PASSIVE_PORT_START, PASSIVE_PORT_END].join(
                    ":",
                ),
                PUBLICHOST: "127.0.0.1",
                ADDED_FLAGS: "--tls=1",
                TLS_CN: "localhost",
                TLS_ORG: "eridu-tech",
                TLS_C: "DE",
                TLS_USE_DSAPRAM: "true",
            })
            .withWaitStrategy(
                Wait.forSuccessfulCommand(
                    "bash -c 'exec 3<>/dev/tcp/127.0.0.1/21'",
                ).withStartupTimeout(timeout.toMilliseconds()),
            )
            .start();
        const accessSettings: AccessOptions = {
            host: startedContainer.getHost(),
            port: startedContainer.getMappedPort(FTP_PORT),
            user: USERNAME,
            password: PASSWORD,
        };
        pool = ftpPool({ accessSettings });
        adapter_ = new FtpFileStorageAdapter({ pool });
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
