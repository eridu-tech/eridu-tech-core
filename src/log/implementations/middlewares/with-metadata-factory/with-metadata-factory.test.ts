import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { withMetadataFactory } from "@/log/implementations/middlewares/with-metadata-factory/with-metadata-factory.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

import type { Mock } from "vitest";

describe("function: withMetadataFactory", () => {
    const transport = new NoOpLogTransport();
    const log = new Log({
        transport,
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });
    let logSpy: Mock<NoOpLogTransport["log"]>;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        logSpy = vi.spyOn(transport, "log");
    });

    test("Should select the transport passed to use", async () => {
        const logResolver = {
            use: vi.fn((_transportName?: "primary" | "secondary") => log),
        };
        const fn = use<[], Promise<number>>(
            function handler(): Promise<number> {
                log.info(["inside"]);
                return Promise.resolve(1);
            },
            withMetadataFactory(logResolver).use("secondary")<[], number>({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        await fn();

        expect(logResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            filePath: "/app/src/math.ts",
            class: undefined,
            function: "handler",
        });
    });

    test("Should attach the file path, class name, and function name while the wrapped function runs", async () => {
        const fn = use(
            function handler(first: number, second: number): Promise<number> {
                log.info(["inside"]);
                return Promise.resolve(first + second);
            },
            withMetadataFactory({ use: () => log })<[number, number], number>({
                className: "MathService",
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        await fn(1, 2);

        expect(logSpy).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                messages: ["inside"],
                metadata: {
                    filePath: "/app/src/math.ts",
                    class: "MathService",
                    function: "handler",
                },
            }),
        );
    });

    test("Should merge the metadata returned by the metadata callback", async () => {
        const fn = use(
            function handler(first: number, second: number): Promise<number> {
                log.info(["inside"]);
                return Promise.resolve(first + second);
            },
            withMetadataFactory({ use: () => log })<[number, number], number>({
                getCurrentFilePath: () => "/app/src/math.ts",
                metadata: ({ functionName, args }) => ({
                    functionName,
                    argCount: args.length,
                }),
            }),
        );

        await fn(1, 2);

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            functionName: "handler",
            argCount: 2,
            filePath: "/app/src/math.ts",
            class: undefined,
            function: "handler",
        });
    });

    test("Should pass the function name and arguments to the metadata callback", async () => {
        const metadata = vi.fn(() => ({}));
        const fn = use(
            function handler(_name: string, _count: number): Promise<string> {
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => log })<[string, number], string>({
                metadata,
            }),
        );

        await fn("Ada", 1);

        expect(metadata).toHaveBeenCalledExactlyOnceWith({
            functionName: "handler",
            args: ["Ada", 1],
        });
    });

    test("Should let the built-in entries override the metadata callback values", async () => {
        const fn = use(
            function handler(): Promise<string> {
                log.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => log })<[], string>({
                className: "MathService",
                getCurrentFilePath: () => "/app/src/math.ts",
                metadata: () => ({
                    function: "overridden",
                    class: "Overridden",
                    extra: true,
                }),
            }),
        );

        await fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            extra: true,
            filePath: "/app/src/math.ts",
            class: "MathService",
            function: "handler",
        });
    });

    test("Should attach a null file path when the resolver returns null", async () => {
        const fn = use(
            function handler(): Promise<string> {
                log.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => log })<[], string>({
                getCurrentFilePath: () => null,
            }),
        );

        await fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            filePath: null,
            class: undefined,
            function: "handler",
        });
    });

    test("Should default the file path to the middleware module path", async () => {
        const fn = use(
            function handler(): Promise<string> {
                log.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => log })<[], string>(),
        );

        await fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata?.["filePath"]).toMatch(
            /with-metadata-factory\.ts$/,
        );
    });

    test("Should leave the class name undefined when it is not configured", async () => {
        const fn = use(
            function handler(): Promise<string> {
                log.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => log })<[], string>({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        await fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toHaveProperty("class", undefined);
    });

    test("Should resolve the file path on every invocation", async () => {
        const getCurrentFilePath = vi.fn(() => "/app/src/math.ts");
        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => log })<[], string>({
                getCurrentFilePath,
            }),
        );

        await fn();
        await fn();

        expect(getCurrentFilePath).toHaveBeenCalledTimes(2);
    });

    test("Should not attach the metadata to entries logged after the call", async () => {
        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => log })<[], string>({
                className: "MathService",
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        await fn();
        log.info(["after"]);

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toBeUndefined();
    });

    test("Should not set the other extra info of the entry", async () => {
        const fn = use(
            function handler(): Promise<string> {
                log.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => log })<[], string>({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        await fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.group).toBeUndefined();
        expect(entry?.error).toBeUndefined();
        expect(entry?.spans).toBeUndefined();
    });

    test("Should return the resolved value of the wrapped function", async () => {
        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("result");
            },
            withMetadataFactory({ use: () => log })<[], string>(),
        );

        await expect(fn()).resolves.toBe("result");
    });

    test("Should propagate a rejection from the wrapped function", async () => {
        const fn = use(
            function handler(): Promise<string> {
                return Promise.reject(new Error("boom"));
            },
            withMetadataFactory({ use: () => log })<[], string>(),
        );

        await expect(fn()).rejects.toThrow("boom");
    });
});
