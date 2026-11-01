import { fileStorage } from "./file-storage-initial-config.js";

await fileStorage.removeMany([
    fileStorage.create("file-1.txt"),
    fileStorage.create("file-2.txt"),
    fileStorage.create("file-3.txt"),
]);
