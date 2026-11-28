import { randomUUID } from "node:crypto";

import {
    GetObjectCommand,
    HeadBucketCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { S3Server } from "@/test-utilities/servers/s3-server/s3-server.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

const timeout = TimeSpan.fromMinutes(3);

describe("class: S3Server", { tags: ["S3", "TestUtilities"] }, () => {
    const server = new S3Server();
    let client: S3Client;
    beforeAll(async () => {
        await server.init();
        client = new S3Client(server.getSettings());
    }, timeout.toMilliseconds());
    afterAll(async () => {
        client.destroy();
        await server.deInit();
    }, timeout.toMilliseconds());

    test("Should store and read an object in the default bucket", async () => {
        const bucket = server.getBucket();
        const key = `${randomUUID()}.txt`;
        const content = "hello s3";

        await expect(
            client.send(new HeadBucketCommand({ Bucket: bucket })),
        ).resolves.toBeDefined();

        await client.send(
            new PutObjectCommand({ Bucket: bucket, Key: key, Body: content }),
        );
        const object = await client.send(
            new GetObjectCommand({ Bucket: bucket, Key: key }),
        );

        expect(await object.Body?.transformToString()).toBe(content);
    });

    test("Should throw when getSettings is called before init", () => {
        expect(() => new S3Server().getSettings()).toThrow();
    });
});
