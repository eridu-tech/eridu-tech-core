import { randomUUID } from "node:crypto";

import {
    HeadBucketCommand,
    NotFound,
    PutBucketWebsiteCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
} from "vitest";

import { S3FileStorageAdapter } from "@/file-storage/implementations/adapters/s3-file-storage-adapter/_module-exports.js";
import { withFileStoragePrefix } from "@/file-storage/implementations/plugins/_module-exports.js";
import { fileStorageAdapterTestSuite } from "@/file-storage/implementations/test-utilities/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { S3Server } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);

const BUCKET = "files";

describe(
    "class: S3FileStorageAdapter",
    {
        timeout: TimeSpan.fromSeconds(10).toMilliseconds(),
    },
    () => {
        let client: S3Client;
        let adapter_: S3FileStorageAdapter;
        const s3Server = new S3Server({ BUCKET });
        beforeAll(async () => {
            await s3Server.init();
            client = new S3Client(s3Server.getClientConfig());
        }, timeout.toMilliseconds());
        beforeEach(() => {
            adapter_ = withPlugin(
                new S3FileStorageAdapter({
                    client,
                    bucket: BUCKET,
                    serverSideEncryption: null,
                }),
                withFileStoragePrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            client.destroy();
            await s3Server.deInit();
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
                    cdnUrl: s3Server.getBucketWebUrl(),
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
                const retrievedData = new Uint8Array(
                    await response.arrayBuffer(),
                );
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
                const retrievedData = new Uint8Array(
                    await response.arrayBuffer(),
                );
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
            // The shared bucket is still filled with objects written by the
            // other tests, and Garage refuses to delete a non-empty bucket.
            // `deInit` swallows that error, so each test needs its own bucket.
            let bucket: string;
            beforeEach(() => {
                bucket = `deinit-${randomUUID()}`;
            });
            test("Should remove the bucket", async () => {
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
    },
);
