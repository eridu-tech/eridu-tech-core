import { afterEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { withMetadataFactory } from "@/logger/implementations/middlewares/with-metadata-factory/with-metadata-factory.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

describe("function: withMetadataFactory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    function createLogger() {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
        return { logger, logSpy };
    }

    test("Should select the transport passed to use", async () => {
        const { logger, logSpy } = createLogger();
        const loggerResolver = {
            use: vi.fn((_transportName?: "primary" | "secondary") => logger),
        };
        const fn = use<[], Promise<number>>(
            function handler(): Promise<number> {
                logger.info(["inside"]);
                return Promise.resolve(1);
            },
            withMetadataFactory(loggerResolver).use("secondary")<[], number>({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        await fn();

        expect(loggerResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            filePath: "/app/src/math.ts",
            class: undefined,
            function: "handler",
        });
    });

    test("Should attach the file path, class name, and function name while the wrapped function runs", async () => {
        const { logger, logSpy } = createLogger();
        const fn = use(
            function handler(first: number, second: number): Promise<number> {
                logger.info(["inside"]);
                return Promise.resolve(first + second);
            },
            withMetadataFactory({ use: () => logger })<
                [number, number],
                number
            >({
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
        const { logger, logSpy } = createLogger();
        const fn = use(
            function handler(first: number, second: number): Promise<number> {
                logger.info(["inside"]);
                return Promise.resolve(first + second);
            },
            withMetadataFactory({ use: () => logger })<
                [number, number],
                number
            >({
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
        const { logger } = createLogger();
        const metadata = vi.fn(() => ({}));
        const fn = use(
            function handler(_name: string, _count: number): Promise<string> {
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => logger })<
                [string, number],
                string
            >({ metadata }),
        );

        await fn("Ada", 1);

        expect(metadata).toHaveBeenCalledExactlyOnceWith({
            functionName: "handler",
            args: ["Ada", 1],
        });
    });

    test("Should let the built-in entries override the metadata callback values", async () => {
        const { logger, logSpy } = createLogger();
        const fn = use(
            function handler(): Promise<string> {
                logger.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => logger })<[], string>({
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
        const { logger, logSpy } = createLogger();
        const fn = use(
            function handler(): Promise<string> {
                logger.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => logger })<[], string>({
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
        const { logger, logSpy } = createLogger();
        const fn = use(
            function handler(): Promise<string> {
                logger.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => logger })<[], string>(),
        );

        await fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata?.["filePath"]).toMatch(
            /with-metadata-factory\.ts$/,
        );
    });

    test("Should leave the class name undefined when it is not configured", async () => {
        const { logger, logSpy } = createLogger();
        const fn = use(
            function handler(): Promise<string> {
                logger.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => logger })<[], string>({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        await fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toHaveProperty("class", undefined);
    });

    test("Should resolve the file path on every invocation", async () => {
        const { logger } = createLogger();
        const getCurrentFilePath = vi.fn(() => "/app/src/math.ts");
        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => logger })<[], string>({
                getCurrentFilePath,
            }),
        );

        await fn();
        await fn();

        expect(getCurrentFilePath).toHaveBeenCalledTimes(2);
    });

    test("Should not attach the metadata to entries logged after the call", async () => {
        const { logger, logSpy } = createLogger();
        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => logger })<[], string>({
                className: "MathService",
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        await fn();
        logger.info(["after"]);

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toBeUndefined();
    });

    test("Should not set the other extra info of the entry", async () => {
        const { logger, logSpy } = createLogger();
        const fn = use(
            function handler(): Promise<string> {
                logger.info(["inside"]);
                return Promise.resolve("ok");
            },
            withMetadataFactory({ use: () => logger })<[], string>({
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
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("result");
            },
            withMetadataFactory({ use: () => logger })<[], string>(),
        );

        await expect(fn()).resolves.toBe("result");
    });

    test("Should propagate a rejection from the wrapped function", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const fn = use(
            function handler(): Promise<string> {
                return Promise.reject(new Error("boom"));
            },
            withMetadataFactory({ use: () => logger })<[], string>(),
        );

        await expect(fn()).rejects.toThrow("boom");
    });
});
