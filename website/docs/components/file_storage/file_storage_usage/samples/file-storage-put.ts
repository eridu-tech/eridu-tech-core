import { fileStorage } from "./file-storage-initial-config.js";

const hasUpdated = await fileStorage.create("file.txt").put({ data: "TEXT 1" });
await fileStorage.create("file.txt").put({ data: "TEXT 2" });
