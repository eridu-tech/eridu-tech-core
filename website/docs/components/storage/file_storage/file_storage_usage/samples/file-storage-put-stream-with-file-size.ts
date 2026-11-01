import { fileStorage } from "./file-storage-initial-config.js";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { FileSize } from "eridu-tech/file-size";

const { size } = await stat("./file.txt");

await fileStorage.create("file.txt").putStream({
    data: createReadStream("./file.txt"),
    fileSize: FileSize.fromBytes(size),
});
