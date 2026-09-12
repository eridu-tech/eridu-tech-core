import { fileStorage } from "./file-storage-initial-config.js";

await fileStorage.create("source.txt").copyAndReplace("destination.txt");
