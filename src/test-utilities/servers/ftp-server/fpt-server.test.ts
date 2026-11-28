import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { Client } from "basic-ftp";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { FtpServer } from "@/test-utilities/servers/ftp-server/fpt-server.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

const timeout = TimeSpan.fromMinutes(3);

describe("class: FtpServer", { tags: ["FTP", "TestUtilities"] }, () => {
    const server = new FtpServer();
    let client: Client;
    beforeAll(async () => {
        await server.init();
        client = new Client();
        await client.access(server.getSettings());
    }, timeout.toMilliseconds());
    afterAll(async () => {
        client.close();
        await server.deInit();
    }, timeout.toMilliseconds());

    test("Should upload a file to the user home directory", async () => {
        const fileName = `${randomUUID()}.txt`;
        const content = "hello ftp";

        await client.uploadFrom(Readable.from([content]), fileName);

        expect(await client.size(fileName)).toBe(content.length);
        const files = await client.list();
        expect(files.map((file) => file.name)).toContain(fileName);
    });

    test("Should throw when getSettings is called before init", () => {
        expect(() => new FtpServer().getSettings()).toThrow();
    });
});
