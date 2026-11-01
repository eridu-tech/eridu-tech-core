import { fileStorageResolver } from "./file-storage-resolver-initial-config.js";

await fileStorageResolver
    .use()
    .create("file.txt")
    .put({ data: "Text file content" });
