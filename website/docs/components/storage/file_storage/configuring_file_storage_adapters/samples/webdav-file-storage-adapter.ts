import { WebdavFileStorageAdapter } from "eridu-tech/file-storage/webdav-file-storage-adapter";
import { createClient } from "webdav";

const webdavClient = createClient("https://webdav.example.com/files", {
    username: "user",
    password: "password",
});

const webdavFileStorageAdapter = new WebdavFileStorageAdapter({
    client: webdavClient,
});
