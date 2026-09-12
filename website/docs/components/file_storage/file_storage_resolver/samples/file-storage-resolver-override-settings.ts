import { fileStorageResolver } from "./file-storage-resolver-initial-config.js";

await fileStorageResolver
    .setDefaultCacheControl("public, max-age=31536000")
    .use("fs")
    .create("file.txt")
    .add({ data: "Text file content" });
