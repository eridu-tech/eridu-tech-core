import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createClient } from "webdav";

import { WebdavServer } from "@/test-utilities/servers/webdav-server/webdav-server.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { WebDAVClient } from "webdav";

const timeout = TimeSpan.fromMinutes(3);

describe("class: WebdavServer", { tags: ["WebDAV", "TestUtilities"] }, () => {
    const server = new WebdavServer();
    let client: WebDAVClient;
    beforeAll(async () => {
        await server.init();
        const { url, username, password } = server.getSettings();
        client = createClient(url, {
            username,
            password,
        });
    }, timeout.toMilliseconds());
    afterAll(async () => {
        await server.deInit();
    }, timeout.toMilliseconds());

    test("Should upload a file to the root directory", async () => {
        const fileName = `${randomUUID()}.txt`;
        const filePath = `/${fileName}`;
        const content = "hello webdav";

        await client.putFileContents(filePath, content);

        const downloaded = await client.getFileContents(filePath, {
            format: "text",
        });
        expect(downloaded).toBe(content);

        const files = await client.getDirectoryContents("/");
        expect(files.map((file) => file.basename)).toContain(fileName);
    });

    test("Should throw when getSettings is called before init", () => {
        expect(() => new WebdavServer().getSettings()).toThrow();
    });
});
