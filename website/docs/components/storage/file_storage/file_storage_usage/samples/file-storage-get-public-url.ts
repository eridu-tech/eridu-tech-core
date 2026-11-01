import { fileStorage } from "./file-storage-initial-config.js";

const file = fileStorage.create("source.txt");
await file.put({ data: "CONTENT" });

const publicUrl = await file.getPublicUrl();

console.log(publicUrl);
