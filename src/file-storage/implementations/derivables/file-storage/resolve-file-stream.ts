/**
 * @module FileStorage
 */

import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";

import type { FileContent } from "@/file-storage/contracts/_module-exports.js";
import type { Bytes, ByteStream } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ResolveFileStream implements ByteStream {
    constructor(private readonly fileStream: AsyncIterable<FileContent>) {}

    async *[Symbol.asyncIterator](): AsyncIterator<Bytes> {
        for await (const content of this.fileStream) {
            yield resolveFileContent(content);
        }
    }
}
