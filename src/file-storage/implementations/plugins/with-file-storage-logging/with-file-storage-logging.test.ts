import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module-exports.js";
import { withFileStorageLogging } from "@/file-storage/implementations/plugins/with-file-storage-logging/with-file-storage-logging.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type {
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";

describe("function: withFileStorageLogging", () => {
    const commonSettings = {
        contentType: "text/plain",
        contentLanguage: null,
        contentEncoding: null,
        contentDisposition: null,
        cacheControl: null,
    };

    function createContent(): WritableFileAdapterContent {
        return {
            data: new Uint8Array([1, 2, 3]),
            fileSizeInBytes: 3,
            ...commonSettings,
        };
    }

    function createStream(): WritableFileAdapterStream {
        return {
            data: (async function* generate(): AsyncGenerator<Uint8Array> {
                await Promise.resolve();
                yield new Uint8Array([1, 2, 3]);
            })(),
            fileSizeInBytes: 3,
            ...commonSettings,
        };
    }

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry metadata", () => {
        test("Should attach the adapter class name, the arguments and the result", async () => {
            class TestAdapter extends NoOpFileStorageAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.exists("myKey");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["file-storage.exists succeeded"]);
            expect(entry?.metadata).toEqual({
                "file-storage.adapter": "TestAdapter",
                "file-storage.args": ["myKey"],
                "file-storage.result": false,
            });
        });

        test("Should store the file key and the settings but not the data", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.put("myKey", createContent());

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.metadata).toEqual({
                "file-storage.adapter": "NoOpFileStorageAdapter",
                "file-storage.args": [
                    "myKey",
                    {
                        fileSizeInBytes: 3,
                        ...commonSettings,
                    },
                ],
                "file-storage.result": undefined,
            });
        });
    });

    describe("method: copy", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.copy("source-key", "destination-key");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.copy succeeded",
            );
        });
    });

    describe("method: exists", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.exists("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.exists succeeded",
            );
        });
    });

    describe("method: getBytes", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.getBytes("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.getBytes succeeded",
            );
        });
    });

    describe("method: getMetaData", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.getMetaData("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.getMetaData succeeded",
            );
        });
    });

    describe("method: getStream", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.getStream("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.getStream succeeded",
            );
        });
    });

    describe("method: move", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.move("source-key", "destination-key");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.move succeeded",
            );
        });
    });

    describe("method: put", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.put("myKey", createContent());

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.put succeeded",
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const error = new Error("put failed");
            vi.spyOn(adapter, "put").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await expect(
                enhanced.put("myKey", createContent()),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.put failed",
            );
        });
    });

    describe("method: putStream", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.putStream("myKey", createStream());

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.putStream succeeded",
            );
        });
    });

    describe("method: removeByPrefix", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.removeByPrefix("folder/");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.removeByPrefix succeeded",
            );
        });
    });

    describe("method: removeMany", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withFileStorageLogging(logger),
            );

            await enhanced.removeMany(["key-1", "key-2"]);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "file-storage.removeMany succeeded",
            );
        });
    });
});
