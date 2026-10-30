/**
 * @module HttpRouter
 */

import { FileSize } from "@/file-size/implementations/_module-exports.js";

import type { IHttpFile } from "@/http-router/contracts/_module-exports.js";
import type { Bytes } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class HttpFile implements IHttpFile {
    constructor(private readonly file: File) {}

    async *[Symbol.asyncIterator](): AsyncIterator<Bytes> {
        yield* this.file.stream();
    }

    asText(): Promise<string> {
        return this.file.text();
    }

    asBytes(): Promise<Bytes> {
        return this.file.bytes();
    }

    asArrayBuffer(): Promise<ArrayBuffer> {
        return this.file.arrayBuffer();
    }

    asReadableStream(): ReadableStream<Bytes> {
        return this.file.stream();
    }

    asFile(): File {
        return this.file;
    }

    get fileSize(): FileSize {
        return FileSize.fromBytes(this.file.size);
    }

    get name(): string {
        return this.file.name;
    }

    get lastModified(): Date {
        return new Date(this.file.lastModified);
    }

    get contentType(): string {
        return this.file.type;
    }
}
