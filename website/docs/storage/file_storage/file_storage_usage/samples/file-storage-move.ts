import { fileStorage } from "./file-storage-initial-config.js";

// Returns true when the source exists, the destination is overwritten.
const hasMoved = await fileStorage.create("source.txt").move("destination.txt");
console.log(hasMoved);
