import { fileStorage } from "./file-storage-initial-config.js";

await fileStorage.create("source.txt").moveAndReplace("destination.txt");
