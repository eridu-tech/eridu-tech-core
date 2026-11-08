import { beforeEach, describe, expect, test, vi } from "vitest";

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

    describe("entry naming", () => {
        test("Should name entries after the adapter class and the method", async () => {
            class TestAdapter extends NoOpFileStorageAdapter {}
            const adapter = new TestAdapter();
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
                "TestAdapter.exists succeeded",
                {
                    args: ["myKey"],
                    result: false,
                },
            );
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
                "NoOpFileStorageAdapter.copy succeeded",
                {
                    args: ["source-key", "destination-key"],
                    result: true,
                },
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
                "NoOpFileStorageAdapter.exists succeeded",
                {
                    args: ["myKey"],
                    result: false,
                },
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
                "NoOpFileStorageAdapter.getBytes succeeded",
                {
                    args: ["myKey"],
                    result: null,
                },
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
                "NoOpFileStorageAdapter.getMetaData succeeded",
                {
                    args: ["myKey"],
                    result: null,
                },
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
                "NoOpFileStorageAdapter.getStream succeeded",
                {
                    args: ["myKey"],
                    result: null,
                },
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
                "NoOpFileStorageAdapter.move succeeded",
                {
                    args: ["source-key", "destination-key"],
                    result: true,
                },
            );
        });
    });

    describe("method: put", () => {
        test("Should log a debug entry with the key and the settings but not the data", async () => {
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
                "NoOpFileStorageAdapter.put succeeded",
                {
                    args: [
                        "myKey",
                        {
                            fileSizeInBytes: 3,
                            ...commonSettings,
                        },
                    ],
                    result: undefined,
                },
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
                "NoOpFileStorageAdapter.put failed",
                {
                    args: [
                        "myKey",
                        {
                            fileSizeInBytes: 3,
                            ...commonSettings,
                        },
                    ],
                    error,
                },
            );
        });
    });

    describe("method: putStream", () => {
        test("Should log a debug entry with the key and the settings but not the data", async () => {
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
                "NoOpFileStorageAdapter.putStream succeeded",
                {
                    args: [
                        "myKey",
                        {
                            fileSizeInBytes: 3,
                            ...commonSettings,
                        },
                    ],
                    result: undefined,
                },
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
                "NoOpFileStorageAdapter.removeByPrefix succeeded",
                {
                    args: ["folder/"],
                    result: undefined,
                },
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
                "NoOpFileStorageAdapter.removeMany succeeded",
                {
                    args: [["key-1", "key-2"]],
                    result: undefined,
                },
            );
        });
    });
});
