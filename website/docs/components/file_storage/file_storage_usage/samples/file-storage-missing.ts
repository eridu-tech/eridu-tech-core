import { fileStorage } from "./file-storage-initial-config.js";

const missing = await fileStorage.create("file.txt").missing();
