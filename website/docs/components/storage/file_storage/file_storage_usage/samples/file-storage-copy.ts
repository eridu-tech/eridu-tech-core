import { fileStorage } from "./file-storage-initial-config.js";

// Returns true when the source exists, the destination is overwritten.
const hasCopied = await fileStorage
    .create("source.txt")
    .copy("destination.txt");
console.log(hasCopied);
