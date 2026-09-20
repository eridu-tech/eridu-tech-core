import { fileStorage } from "./file-storage-initial-config.js";

const exists = await fileStorage.create("file.txt").exists();
