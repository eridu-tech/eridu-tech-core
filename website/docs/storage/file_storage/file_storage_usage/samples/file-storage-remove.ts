import { fileStorage } from "./file-storage-initial-config.js";

await fileStorage.create("file.txt").remove();
