import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { SftpFactory } from "@/file-storage/implementations/adapters/sftp-file-storage-adapter/_module-exports.js";
import { SftpServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);

describe(
    "class: SftpFactory",
    {
        tags: ["SFTP", "Adapters", "Implementations", "FileStorage"],
        concurrent: false,
        timeout: TimeSpan.fromSeconds(10).toMilliseconds(),
    },
    () => {
        let factory: SftpFactory;
        const sftpServer = new SftpServer();
        beforeAll(async () => {
            await sftpServer.init();
            factory = new SftpFactory({
                connectionSettings: sftpServer.getSettings(),
            });
        }, timeout.toMilliseconds());
        afterAll(async () => {
            await sftpServer.deInit();
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
    },
);
