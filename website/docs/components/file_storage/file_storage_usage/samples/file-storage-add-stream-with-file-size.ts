import { fileStorage } from "./file-storage-initial-config.js";
import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises";
import { FileSize } from "eridu-tech/file-size";

const fileStream = createReadStream("./file.txt")
const { size } = await stat("./file.txt")

const hasAdded = await fileStorage.create("file.txt").addStream({
    data: fileStream,
    fileSize: FileSize.fromBytes(size)
})
