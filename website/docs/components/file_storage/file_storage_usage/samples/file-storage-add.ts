import { fileStorage } from "./file-storage-initial-config.js";

const hasAdded = await fileStorage.create("file.txt").add({ data: "CONTENT" });
