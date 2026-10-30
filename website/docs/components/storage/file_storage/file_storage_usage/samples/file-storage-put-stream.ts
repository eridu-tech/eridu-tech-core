import { fileStorage } from "./file-storage-initial-config.js";
import { createReadStream } from "node:fs";

await fileStorage
    .create("file.txt")
    .putStream({ data: createReadStream("./file.txt") });
await fileStorage
    .create("file.txt")
    .putStream({ data: createReadStream("./file.txt") });
