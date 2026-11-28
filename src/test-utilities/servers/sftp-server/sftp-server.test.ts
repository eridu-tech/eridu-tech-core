import { randomUUID } from "node:crypto";

import SftpClient from "ssh2-sftp-client";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { SftpServer } from "@/test-utilities/servers/sftp-server/sftp-server.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

const timeout = TimeSpan.fromMinutes(3);

describe("class: SftpServer", { tags: ["SFTP", "TestUtilities"] }, () => {
    const server = new SftpServer();
    let client: SftpClient;
    beforeAll(async () => {
        await server.init();
        client = new SftpClient();
        await client.connect(server.getSettings());
    }, timeout.toMilliseconds());
    afterAll(async () => {
        await client.end();
        await server.deInit();
    }, timeout.toMilliseconds());

    test("Should upload a file to the user home directory", async () => {
        const homeDirectory = server.getHomeDirectory();
        const fileName = `${randomUUID()}.txt`;
        const filePath = `${homeDirectory}/${fileName}`;
        const content = "hello sftp";

        await client.put(Buffer.from(content), filePath);

        const downloaded = await client.get(filePath);
        expect(downloaded).toEqual(Buffer.from(content));

        const files = await client.list(homeDirectory);
        expect(files.map((file) => file.name)).toContain(fileName);
    });

    test("Should throw when getSettings is called before init", () => {
        expect(() => new SftpServer().getSettings()).toThrow();
    });
});
