import { fileStorage } from "./file-storage-initial-config.js";

const file = fileStorage.create("file.txt");

// Will return the file name
console.log(file.key);
