import { fileStorage } from "./file-storage-initial-config.js";

const content = await fileStorage.create("file.txt").getBytes();

console.log(content);
