import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { withSyncMetadataFactory } from "@/logger/implementations/middlewares/with-sync-metadata-factory/with-sync-metadata-factory.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

import type { Mock } from "vitest";

describe("function: withSyncMetadataFactory", () => {
    const transport = new NoOpLoggerTransport();
    const logger = new Logger({
        transport,
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });
    let logSpy: Mock<NoOpLoggerTransport["log"]>;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        logSpy = vi.spyOn(transport, "log");
    });

    test("Should select the transport passed to use", () => {
        const loggerResolver = {
            use: vi.fn((_transportName?: "primary" | "secondary") => logger),
        };
        const fn = use<[], number>(
            function handler(): number {
                logger.info(["inside"]);
                return 1;
            },
            withSyncMetadataFactory(loggerResolver).use("secondary")<
                [],
                number
            >({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        fn();

        expect(loggerResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            filePath: "/app/src/math.ts",
            class: undefined,
            function: "handler",
        });
    });

    test("Should attach the file path, class name, and function name while the wrapped function runs", () => {
        const fn = use(
            function handler(first: number, second: number): number {
                logger.info(["inside"]);
                return first + second;
            },
            withSyncMetadataFactory({ use: () => logger })<
                [number, number],
                number
            >({
                className: "MathService",
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        fn(1, 2);

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

    test("Should merge the metadata returned by the metadata callback", () => {
        const fn = use(
            function handler(first: number, second: number): number {
                logger.info(["inside"]);
                return first + second;
            },
            withSyncMetadataFactory({ use: () => logger })<
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

        fn(1, 2);

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            functionName: "handler",
            argCount: 2,
            filePath: "/app/src/math.ts",
            class: undefined,
            function: "handler",
        });
    });

    test("Should pass the function name and arguments to the metadata callback", () => {
        const metadata = vi.fn(() => ({}));
        const fn = use(
            function handler(_name: string, _count: number): string {
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<
                [string, number],
                string
            >({ metadata }),
        );

        fn("Ada", 1);

        expect(metadata).toHaveBeenCalledExactlyOnceWith({
            functionName: "handler",
            args: ["Ada", 1],
        });
    });

    test("Should let the built-in entries override the metadata callback values", () => {
        const fn = use(
            function handler(): string {
                logger.info(["inside"]);
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>({
                className: "MathService",
                getCurrentFilePath: () => "/app/src/math.ts",
                metadata: () => ({
                    function: "overridden",
                    class: "Overridden",
                    extra: true,
                }),
            }),
        );

        fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            extra: true,
            filePath: "/app/src/math.ts",
            class: "MathService",
            function: "handler",
        });
    });

    test("Should attach a null file path when the resolver returns null", () => {
        const fn = use(
            function handler(): string {
                logger.info(["inside"]);
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>({
                getCurrentFilePath: () => null,
            }),
        );

        fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toStrictEqual({
            filePath: null,
            class: undefined,
            function: "handler",
        });
    });

    test("Should default the file path to the middleware module path", () => {
        const fn = use(
            function handler(): string {
                logger.info(["inside"]);
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>(),
        );

        fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata?.["filePath"]).toMatch(
            /with-sync-metadata-factory\.ts$/,
        );
    });

    test("Should leave the class name undefined when it is not configured", () => {
        const fn = use(
            function handler(): string {
                logger.info(["inside"]);
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toHaveProperty("class", undefined);
    });

    test("Should resolve the file path on every invocation", () => {
        const getCurrentFilePath = vi.fn(() => "/app/src/math.ts");
        const fn = use(
            function handler(): string {
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>({
                getCurrentFilePath,
            }),
        );

        fn();
        fn();

        expect(getCurrentFilePath).toHaveBeenCalledTimes(2);
    });

    test("Should not attach the metadata to entries logged after the call", () => {
        const fn = use(
            function handler(): string {
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>({
                className: "MathService",
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        fn();
        logger.info(["after"]);

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.metadata).toBeUndefined();
    });

    test("Should not set the other extra info of the entry", () => {
        const fn = use(
            function handler(): string {
                logger.info(["inside"]);
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        fn();

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.group).toBeUndefined();
        expect(entry?.error).toBeUndefined();
        expect(entry?.spans).toBeUndefined();
    });

    test("Should return the value of the wrapped function synchronously", () => {
        const fn = use(
            function handler(): string {
                return "result";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>(),
        );

        const result = fn();

        expect(result).toBe("result");
        expect(result).not.toBeInstanceOf(Promise);
    });

    test("Should propagate an error from the wrapped function", () => {
        const fn = use(
            function handler(): string {
                throw new Error("boom");
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>(),
        );

        expect(() => fn()).toThrow("boom");
    });
});
