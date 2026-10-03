import { fileStorage } from "./file-storage-resolver-di-factory.js";

// Uses the storage2 adapter
await fileStorage
    .use("storage2")
    .create("file.txt")
    .add({ data: "Text file content" });
