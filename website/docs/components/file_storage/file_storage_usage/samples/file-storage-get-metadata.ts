import { fileStorage } from "./file-storage-initial-config.js";

const metadata = await fileStorage.create("file.txt").getMetadata();
console.log(metadata);
