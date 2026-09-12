import { fileStorage } from "./file-storage-initial-config.js";

await fileStorage.create("source.txt").move("destination.txt");
