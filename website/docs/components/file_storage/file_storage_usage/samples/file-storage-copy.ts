import { fileStorage } from "./file-storage-initial-config.js";

await fileStorage.create("source.txt").copy("destination.txt");
