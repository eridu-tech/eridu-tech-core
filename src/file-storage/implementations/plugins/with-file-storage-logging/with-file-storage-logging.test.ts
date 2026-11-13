import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpFileStorageAdapter } from "@/file-storage/implementations/adapters/no-op-file-storage-adapter/_module-exports.js";
import { withFileStorageLogging } from "@/file-storage/implementations/plugins/with-file-storage-logging/with-file-storage-logging.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
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
        test("Should attach the group, the adapter class name, the key and the result", async () => {
            class TestAdapter extends NoOpFileStorageAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.exists("myKey");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["exists succeeded"]);
            expect(entry?.group).toEqual("[FileStorage]");
            expect(entry?.metadata).toEqual({
                adapter: "TestAdapter",
                key: "myKey",
                result: false,
            });
        });

        test("Should store the file key and the settings but not the data", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.put("myKey", createContent());

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["put succeeded"]);
            expect(entry?.group).toEqual("[FileStorage]");
            expect(entry?.metadata).toEqual({
                adapter: "NoOpFileStorageAdapter",
                key: "myKey",
                content: {
                    fileSizeInBytes: 3,
                    ...commonSettings,
                },
            });
        });

        test("Should attach the error without metadata when the call fails", async () => {
            class TestAdapter extends NoOpFileStorageAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const error = new Error("exists failed");
            vi.spyOn(adapter, "exists").mockRejectedValueOnce(error);
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(enhanced.exists("myKey")).rejects.toThrow(error);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.level).toEqual("error");
            expect(entry?.messages).toEqual(["exists failed"]);
            expect(entry?.error).toBe(error);
            expect(entry?.metadata).toBeUndefined();
        });
    });

    describe("method: copy", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.copy("source-key", "destination-key");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["copy succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        source: "source-key",
                        destination: "destination-key",
                        result: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("copy failed");
            vi.spyOn(adapter, "copy").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(
                enhanced.copy("source-key", "destination-key"),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(["copy failed"], {
                error,
            });
        });
    });

    describe("method: exists", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.exists("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["exists succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        key: "myKey",
                        result: false,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("exists failed");
            vi.spyOn(adapter, "exists").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(enhanced.exists("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["exists failed"],
                { error },
            );
        });
    });

    describe("method: getBytes", () => {
        test("Should log a debug entry without the returned bytes", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.getBytes("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["getBytes succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        key: "myKey",
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("getBytes failed");
            vi.spyOn(adapter, "getBytes").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(enhanced.getBytes("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["getBytes failed"],
                { error },
            );
        });
    });

    describe("method: getMetaData", () => {
        test("Should log a debug entry with the returned metadata", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.getMetaData("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["getMetaData succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        key: "myKey",
                        metadata: null,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("getMetaData failed");
            vi.spyOn(adapter, "getMetaData").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(enhanced.getMetaData("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["getMetaData failed"],
                { error },
            );
        });
    });

    describe("method: getStream", () => {
        test("Should log a debug entry without the returned stream", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.getStream("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["getStream succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        key: "myKey",
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("getStream failed");
            vi.spyOn(adapter, "getStream").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(enhanced.getStream("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["getStream failed"],
                { error },
            );
        });
    });

    describe("method: move", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.move("source-key", "destination-key");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["move succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        source: "source-key",
                        destination: "destination-key",
                        result: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("move failed");
            vi.spyOn(adapter, "move").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(
                enhanced.move("source-key", "destination-key"),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(["move failed"], {
                error,
            });
        });
    });

    describe("method: put", () => {
        test("Should log a debug entry without the data payload", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.put("myKey", createContent());

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["put succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        key: "myKey",
                        content: {
                            fileSizeInBytes: 3,
                            ...commonSettings,
                        },
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("put failed");
            vi.spyOn(adapter, "put").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(
                enhanced.put("myKey", createContent()),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(["put failed"], {
                error,
            });
        });
    });

    describe("method: putStream", () => {
        test("Should log a debug entry without the data payload", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.putStream("myKey", createStream());

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["putStream succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        key: "myKey",
                        stream: {
                            fileSizeInBytes: 3,
                            ...commonSettings,
                        },
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("putStream failed");
            vi.spyOn(adapter, "putStream").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(
                enhanced.putStream("myKey", createStream()),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["putStream failed"],
                { error },
            );
        });
    });

    describe("method: removeByPrefix", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.removeByPrefix("folder/");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["removeByPrefix succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        prefix: "folder/",
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("removeByPrefix failed");
            vi.spyOn(adapter, "removeByPrefix").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(enhanced.removeByPrefix("folder/")).rejects.toThrow(
                error,
            );

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["removeByPrefix failed"],
                { error },
            );
        });
    });

    describe("method: removeMany", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await enhanced.removeMany(["key-1", "key-2"]);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["removeMany succeeded"],
                {
                    group: "[FileStorage]",
                    metadata: {
                        adapter: "NoOpFileStorageAdapter",
                        keys: ["key-1", "key-2"],
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpFileStorageAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("removeMany failed");
            vi.spyOn(adapter, "removeMany").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withFileStorageLogging(log));

            await expect(
                enhanced.removeMany(["key-1", "key-2"]),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["removeMany failed"],
                { error },
            );
        });
    });
});
