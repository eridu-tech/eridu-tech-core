import { fileStorageResolver } from "./file-storage-resolver-initial-config.js";

await fileStorageResolver
    .use("fs")
    .create("file.txt")
    .put({ data: "Text file content" });
