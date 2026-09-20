import { fileStorageResolver } from "./file-storage-resolver-initial-config.js";

await fileStorageResolver
    .use("fs")
    .create("file.txt")
    .add({ data: "Text file content" });
