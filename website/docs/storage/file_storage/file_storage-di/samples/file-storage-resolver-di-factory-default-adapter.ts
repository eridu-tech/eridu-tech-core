import { fileStorage } from "./file-storage-resolver-di-factory.js";

// Uses the adapter configured as the default (storage1)
await fileStorage.create("file.txt").add({ data: "Text file content" });
