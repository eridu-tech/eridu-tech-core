import { fileStorage } from "./file-storage-initial-config.js";

const hasUpdated = await fileStorage
    .create("file.txt")
    .update({ data: "TEXT 1" });
