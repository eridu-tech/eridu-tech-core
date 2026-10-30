import { Base64Codec } from "eridu-tech/codec/base-64-codec";
import { WebdavFileStorageAdapter } from "eridu-tech/file-storage/webdav-file-storage-adapter";
import { createClient } from "webdav";

const webdavClient = createClient("https://webdav.example.com", {
    username: "user",
    password: "password",
    // Prefix for every path, when the server is mounted on a sub path
    remoteBasePath: "files",
    headers: {
        "X-Custom-Header": "value",
    },
});

const webdavFileStorageAdapter = new WebdavFileStorageAdapter({
    client: webdavClient,
    delimiter: "/",
    codec: new Base64Codec(),
});
