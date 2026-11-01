import {
    HeadBucketCommand,
    NotFound,
    PutBucketWebsiteCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { GenericContainer, Wait } from "testcontainers";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { S3FileStorageAdapter } from "@/file-storage/implementations/adapters/s3-file-storage-adapter/_module-exports.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedTestContainer } from "testcontainers";

const timeout = TimeSpan.fromMinutes(2);

const GARAGE_IMAGE = "dxflrs/garage:v2.4.1";
const S3_PORT = 3900;
const WEB_PORT = 3902;
const BUCKET = "files";
const ACCESS_KEY_ID = "GK0123456789abcdef0123456789abcdef";
const SECRET_ACCESS_KEY =
    "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

// Garage requires a configuration file, the `--single-node` and
// `--default-bucket` flags create the cluster layout, the access key and the
// bucket used by the tests.
const GARAGE_CONFIG = `
metadata_dir = "/tmp/meta"
data_dir = "/tmp/data"
db_engine = "sqlite"

replication_factor = 1

rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"
rpc_secret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:${String(S3_PORT)}"

[s3_web]
bind_addr = "[::]:${String(WEB_PORT)}"
root_domain = ".web.garage.localhost"
index = "index.html"
`;

describe("class: S3FileStorageAdapter", () => {
    let client: S3Client;
    let adapter_: S3FileStorageAdapter;
    let startedContainer: StartedTestContainer;
    beforeEach(async () => {
        startedContainer = await new GenericContainer(GARAGE_IMAGE)
            .withCopyContentToContainer([
                { content: GARAGE_CONFIG, target: "/etc/garage.toml" },
            ])
            .withEnvironment({
                GARAGE_DEFAULT_ACCESS_KEY: ACCESS_KEY_ID,
                GARAGE_DEFAULT_SECRET_KEY: SECRET_ACCESS_KEY,
                GARAGE_DEFAULT_BUCKET: BUCKET,
            })
            .withExposedPorts(S3_PORT, WEB_PORT)
            .withCommand([
                "/garage",
                "server",
                "--single-node",
                "--default-bucket",
            ])
            .withWaitStrategy(
                Wait.forLogMessage(
                    /S3 API server listening on/,
                ).withStartupTimeout(timeout.toMilliseconds()),
            )
            .start();
        client = new S3Client({
            endpoint: `http://${startedContainer.getHost()}:${String(startedContainer.getMappedPort(S3_PORT))}`,
            region: "garage",
            credentials: {
                accessKeyId: ACCESS_KEY_ID,
                secretAccessKey: SECRET_ACCESS_KEY,
            },
            forcePathStyle: true,
            // Garage rejects presigned uploads when the SDK attaches a
            // precomputed checksum for the empty body.
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
        });
        adapter_ = new S3FileStorageAdapter({
            client,
            bucket: BUCKET,
            serverSideEncryption: null,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        client.destroy();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    fileStorageAdapterTestSuite({
        createAdapter: async () => {
            await adapter_.init();
            return adapter_;
        },
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: getPublicUrl", () => {
        test("Should return string when key doesnt exists", async () => {
            const adapter = new S3FileStorageAdapter({
                client,
                bucket: BUCKET,
            });
            await adapter.init();

            const key = "a";
            const result = await adapter.getPublicUrl(key);

            expect(result).toBeTypeOf("string");
        });
        test("Should return file data when key exists", async () => {
            // Garage supports neither bucket policies nor anonymous S3
            // requests, a bucket is exposed publicly by serving it as a
            // website on its own domain.
            const adapter = new S3FileStorageAdapter({
                client,
                bucket: BUCKET,
                cdnUrl: `http://${BUCKET}.web.garage.localhost:${String(startedContainer.getMappedPort(WEB_PORT))}`,
            });
            await adapter.init();
            await client.send(
                new PutBucketWebsiteCommand({
                    Bucket: BUCKET,
                    WebsiteConfiguration: {
                        IndexDocument: { Suffix: "index.html" },
                    },
                }),
            );

            const key = "a";
            const data = new Uint8Array(Buffer.from("CONTENT"));
            await adapter.put(key, {
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType: "text/plain",
                fileSizeInBytes: data.byteLength,
                data,
            });
            const url = await adapter.getPublicUrl(key);

            const response = await fetch(url);
            const retrievedData = new Uint8Array(await response.arrayBuffer());
            expect(retrievedData).toEqual(data);
        });
    });
    describe("method: getSignedDownloadUrl", () => {
        test("Should return string when key doesnt exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const key = "a";
            const contentType = "text/plain";
            const contentDisposition = "inline";
            const result = await adapter.getSignedDownloadUrl(key, {
                expirationInSeconds: 5000,
                contentType,
                contentDisposition,
            });

            expect(result).toBeTypeOf("string");
        });
        test("Should return file data when key exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const key = "a";
            const data = new Uint8Array(Buffer.from("CONTENT"));
            const contentType = "text/plain";
            await adapter.put(key, {
                cacheControl: null,
                contentDisposition: null,
                contentEncoding: null,
                contentLanguage: null,
                contentType,
                fileSizeInBytes: data.byteLength,
                data,
            });
            const contentDisposition = "inline";
            const url = await adapter.getSignedDownloadUrl(key, {
                expirationInSeconds: 5000,
                contentType,
                contentDisposition,
            });

            const response = await fetch(url);
            expect(response.headers.get("content-type")).toBe(contentType);
            expect(response.headers.get("content-disposition")).toBe(
                contentDisposition,
            );
            const retrievedData = new Uint8Array(await response.arrayBuffer());
            expect(retrievedData).toEqual(data);
        });
    });
    describe("method: getSignedUploadUrl", () => {
        test("Should persit file data when key doesnt exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const key = "a";
            const contentType = "text/plain";
            const url = await adapter.getSignedUploadUrl(key, {
                expirationInSeconds: 5000,
                contentType,
            });

            const data = new Uint8Array(Buffer.from("CONTENT"));
            await fetch(url, {
                method: "PUT",
                body: data,
            });

            const bytes = await adapter.getBytes(key);
            expect(bytes).toEqual(data);
        });
        test("Should persit file data when key exists", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const key = "a";
            const data = new Uint8Array(Buffer.from("CONTENT"));
            const contentType = "text/plain";
            await adapter.put(key, {
                data,
                fileSizeInBytes: data.byteLength,
                contentType,
                contentLanguage: null,
                contentEncoding: null,
                contentDisposition: null,
                cacheControl: null,
            });

            const url = await adapter.getSignedUploadUrl(key, {
                expirationInSeconds: 5000,
                contentType,
            });
            const newData = new Uint8Array(Buffer.from("NEW_CONTENT"));
            await fetch(url, {
                method: "PUT",
                body: newData,
            });

            const bytes = await adapter.getBytes(key);
            expect(bytes).toEqual(newData);
        });
    });
    describe("method: init", () => {
        test("Should create the bucket", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const promise = client.send(
                new HeadBucketCommand({
                    Bucket: bucket,
                }),
            );
            await expect(promise).resolves.toBeDefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove the bucket", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            await adapter.deInit();

            const promise = client.send(
                new HeadBucketCommand({
                    Bucket: bucket,
                }),
            );
            await expect(promise).rejects.toThrow(NotFound);
        });
        test("Should not throw error when called multiple times", async () => {
            const bucket = "files";
            const adapter = new S3FileStorageAdapter({
                client,
                bucket,
            });
            await adapter.init();

            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
});
