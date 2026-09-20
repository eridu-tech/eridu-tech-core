import { fileStorage } from "./file-storage-initial-config.js";

const hasRemoved = await fileStorage.create("file.txt").remove();
console.log(hasRemoved);
