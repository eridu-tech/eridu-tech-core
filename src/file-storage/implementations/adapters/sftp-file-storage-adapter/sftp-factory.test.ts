import { GenericContainer, Wait } from "testcontainers";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { SftpFactory } from "@/file-storage/implementations/adapters/sftp-file-storage-adapter/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedTestContainer } from "testcontainers";

const timeout = TimeSpan.fromMinutes(2);

const SFTP_IMAGE = "atmoz/sftp";
const SFTP_PORT = 22;
const USERNAME = "eridu";
const PASSWORD = "eridu";

describe("class: SftpFactory", () => {
    let factory: SftpFactory;
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
        factory = new SftpFactory({
            host: startedContainer.getHost(),
            port: startedContainer.getMappedPort(SFTP_PORT),
            username: USERNAME,
            password: PASSWORD,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    describe("method: create", () => {
        test("Should return a connected client", async () => {
            const client = await factory.create();

            await expect(client.cwd()).resolves.toEqual(expect.any(String));

            await client.end();
        });
    });
    describe("method: validate", () => {
        test("Should return true when the client is connected", async () => {
            const client = await factory.create();

            const result = await factory.validate(client);

            expect(result).toBe(true);
            await client.end();
        });
        test("Should return false when the client is closed", async () => {
            const client = await factory.create();
            await client.end();

            const result = await factory.validate(client);

            expect(result).toBe(false);
        });
    });
    describe("method: destroy", () => {
        test("Should close the client connection", async () => {
            const client = await factory.create();

            await factory.destroy(client);

            await expect(client.cwd()).rejects.toThrow();
        });
    });
});
