import { fileStorage } from "./file-storage-resolver-di-factory.js";

// Uses the filesystem adapter
await fileStorage
    .use("fs")
    .create("file.txt")
    .put({ data: "Text file content" });
