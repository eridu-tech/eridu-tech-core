/**
 * @module Process
 */
import type { Promisable } from "type-fest";

import type {
    Sink,
    Bytes,
    ByteStream,
    Invocable,
} from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/process/contracts"`
 * @group Contracts
 */
export type IProcess = {
    getInputStream(): ByteStream;

    getOutputStream(): Sink<Bytes>;

    getErrorStream(): Sink<Bytes>;

    getArgs(): Promise<Array<string>>;

    onClose(callback: Invocable<[], Promisable<void>>): void;
};
