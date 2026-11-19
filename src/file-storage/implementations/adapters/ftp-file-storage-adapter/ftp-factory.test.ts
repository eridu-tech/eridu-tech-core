import { Readable } from "node:stream";

import { Client } from "basic-ftp";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { FtpFactory } from "@/file-storage/implementations/adapters/ftp-file-storage-adapter/_module-exports.js";
import { FtpServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { AccessOptions } from "basic-ftp";

const timeout = TimeSpan.fromMinutes(2);

// The FTP adapter test uses the server defaults (32010-32019). Test files run
// in parallel and passive ports are published 1:1, so this file binds another
// range to avoid clashing with it.
const PASSIVE_PORT_START = 32000;
const PASSIVE_PORT_END = 32009;

describe(
    "class: FtpFactory",
    {
        concurrent: false,
        timeout: TimeSpan.fromSeconds(10).toMilliseconds(),
    },
    () => {
        let factory: FtpFactory;
        let accessSettings: AccessOptions;
        const ftpServer = new FtpServer({
            PASSIVE_PORT_START,
            PASSIVE_PORT_END,
        });
        beforeAll(async () => {
            await ftpServer.init();
            accessSettings = ftpServer.getBasicFtpOptions();
            factory = new FtpFactory({ accessSettings });
        }, timeout.toMilliseconds());
        afterAll(async () => {
            await ftpServer.deInit();
        }, timeout.toMilliseconds());
        describe("method: create", () => {
            test("Should return a connected client", async () => {
                const client = await factory.create();

                await expect(client.pwd()).resolves.toEqual(expect.any(String));

                await factory.destroy(client);
            });
            test("Should connect over TLS when the client factory upgrades the connection", async () => {
                const tlsFactory = new FtpFactory({
                    accessSettings,
                    clientFactory: async (settings) => {
                        const client = new Client(
                            settings.timeout,
                            settings.clientSettings,
                        );
                        await client.access({
                            ...settings.accessSettings,
                            secure: true,
                            secureOptions: { rejectUnauthorized: false },
                        });
                        return client;
                    },
                });

                const client = await tlsFactory.create();

                expect(client.ftp.hasTLS).toBe(true);
                await expect(
                    client.uploadFrom(
                        Readable.from(["tls content"]),
                        "tls.txt",
                    ),
                ).resolves.toMatchObject({ code: 226 });
                await expect(client.list("/")).resolves.toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ name: "tls.txt" }),
                    ]),
                );

                await tlsFactory.destroy(client);
            });
            test("Should reject when the credentials are invalid", async () => {
                const invalidFactory = new FtpFactory({
                    accessSettings: { ...accessSettings, password: "invalid" },
                });

                await expect(invalidFactory.create()).rejects.toThrow();
            });
        });
        describe("method: validate", () => {
            test("Should return true when the client is connected", async () => {
                const client = await factory.create();

                const result = await factory.validate(client);

                expect(result).toBe(true);
                await factory.destroy(client);
            });
            test("Should return false when the client is closed", async () => {
                const client = await factory.create();
                await factory.destroy(client);

                const result = await factory.validate(client);

                expect(result).toBe(false);
            });
        });
        describe("method: destroy", () => {
            test("Should close the client connection", async () => {
                const client = await factory.create();

                await factory.destroy(client);

                await expect(client.pwd()).rejects.toThrow();
            });
        });
    },
);
