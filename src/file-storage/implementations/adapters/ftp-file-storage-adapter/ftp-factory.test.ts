import { Readable } from "node:stream";

import { Client } from "basic-ftp";
import { GenericContainer, Wait } from "testcontainers";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { FtpFactory } from "@/file-storage/implementations/adapters/ftp-file-storage-adapter/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { AccessOptions } from "basic-ftp";
import type { StartedTestContainer } from "testcontainers";

const timeout = TimeSpan.fromMinutes(2);

const FTP_IMAGE = "stilliard/pure-ftpd:hardened";
const FTP_PORT = 21;
const PASSIVE_PORT_START = 32000;
const PASSIVE_PORT_END = 32009;
const PASSIVE_PORTS = Array.from(
    { length: PASSIVE_PORT_END - PASSIVE_PORT_START + 1 },
    (_, index) => PASSIVE_PORT_START + index,
);
const USERNAME = "eridu";
const PASSWORD = "eridu";

describe("class: FtpFactory", () => {
    let factory: FtpFactory;
    let accessSettings: AccessOptions;
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
        accessSettings = {
            host: startedContainer.getHost(),
            port: startedContainer.getMappedPort(FTP_PORT),
            user: USERNAME,
            password: PASSWORD,
        };
        factory = new FtpFactory({ accessSettings });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    describe("method: create", () => {
        test("Should return a connected client", async () => {
            const client = await factory.create();

            await expect(client.pwd()).resolves.toEqual(expect.any(String));

            factory.destroy(client);
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
                client.uploadFrom(Readable.from(["tls content"]), "tls.txt"),
            ).resolves.toMatchObject({ code: 226 });
            await expect(client.list("/")).resolves.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: "tls.txt" }),
                ]),
            );

            tlsFactory.destroy(client);
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
            factory.destroy(client);
        });
        test("Should return false when the client is closed", async () => {
            const client = await factory.create();
            factory.destroy(client);

            const result = await factory.validate(client);

            expect(result).toBe(false);
        });
    });
    describe("method: destroy", () => {
        test("Should close the client connection", async () => {
            const client = await factory.create();

            factory.destroy(client);

            await expect(client.pwd()).rejects.toThrow();
        });
    });
});
