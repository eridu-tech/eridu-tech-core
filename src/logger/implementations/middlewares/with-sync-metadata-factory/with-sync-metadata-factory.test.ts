import { afterEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { withSyncMetadataFactory } from "@/logger/implementations/middlewares/with-sync-metadata-factory/with-sync-metadata-factory.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

describe("function: withSyncMetadataFactory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Should select the transport passed to use", () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
        const loggerResolver = {
            use: vi.fn((_transportName?: "primary" | "secondary") => logger),
        };
        const fn = use<[], number>(
            function handler(): number {
                logger.info("inside");
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
        expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                metadata: {
                    filePath: "/app/src/math.ts",
                    class: undefined,
                    function: "handler",
                },
            }),
        );
    });

    test("Should attach the file path, class name, and function name while the wrapped function runs", () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });

        const fn = use(
            function handler(first: number, second: number): number {
                logger.info("inside");
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
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });

        const fn = use(
            function handler(first: number, second: number): number {
                logger.info("inside");
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

        expect(logSpy).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                messages: ["inside"],
                metadata: {
                    functionName: "handler",
                    argCount: 2,
                    filePath: "/app/src/math.ts",
                    function: "handler",
                },
            }),
        );
    });

    test("Should pass the function name and arguments to the metadata callback", () => {
        const transport = new NoOpLoggerTransport();
        vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
        const metadata = vi.fn(() => ({}));

        const fn = use(
            function handler(_name: string, _count: number): string {
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<
                [string, number],
                string
            >({
                metadata,
            }),
        );

        fn("Ada", 1);

        expect(metadata).toHaveBeenCalledExactlyOnceWith({
            functionName: "handler",
            args: ["Ada", 1],
        });
    });

    test("Should let the built-in entries override the metadata callback values", () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });

        const fn = use(
            function handler(): string {
                logger.info("inside");
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

        expect(logSpy).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                messages: ["inside"],
                metadata: {
                    filePath: "/app/src/math.ts",
                    class: "MathService",
                    function: "handler",
                    extra: true,
                },
            }),
        );
    });

    test("Should attach a null file path when the resolver returns null", () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });

        const fn = use(
            function handler(): string {
                logger.info("inside");
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>({
                getCurrentFilePath: () => null,
            }),
        );

        fn();

        expect(logSpy).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                messages: ["inside"],
                metadata: {
                    filePath: null,
                    function: "handler",
                },
            }),
        );
    });

    test("Should default the file path to the middleware module path", () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });

        const fn = use(
            function handler(): string {
                logger.info("inside");
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>(),
        );

        fn();

        expect(logSpy).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                messages: ["inside"],
                metadata: expect.objectContaining({
                    filePath: expect.stringMatching(
                        /with-sync-metadata-factory\.ts$/,
                    ) as string,
                }) as Partial<Record<string, unknown>>,
            }),
        );
    });

    test("Should leave the class name undefined when it is not configured", () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });

        const fn = use(
            function handler(): string {
                logger.info("inside");
                return "ok";
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>({
                getCurrentFilePath: () => "/app/src/math.ts",
            }),
        );

        fn();

        const [firstCall] = logSpy.mock.calls;
        expect(firstCall?.[0].metadata["class"]).toBeUndefined();
    });

    test("Should resolve the file path on every invocation", () => {
        const transport = new NoOpLoggerTransport();
        vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });
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
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({
            transport,
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
        });

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
        logger.info("after");

        expect(logSpy).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                messages: ["after"],
                metadata: {},
            }),
        );
    });

    test("Should return the value of the wrapped function synchronously", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });

        const fn = use(
            function handler(name: string): string {
                return `Hello ${name}`;
            },
            withSyncMetadataFactory({ use: () => logger })<[string], string>(),
        );

        const result = fn("world");

        expect(result).toBe("Hello world");
        expect(result).not.toBeInstanceOf(Promise);
    });

    test("Should pass the original arguments to the wrapped function", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const wrappedFn = vi.fn(
            (firstName: string, lastName: string): string =>
                `${firstName} ${lastName}`,
        );

        const fn = use(
            wrappedFn,
            withSyncMetadataFactory({ use: () => logger })<
                [string, string],
                string
            >(),
        );

        fn("Ada", "Lovelace");

        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("Ada", "Lovelace");
    });

    test("Should propagate an error thrown by the wrapped function", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });

        const fn = use(
            function handler(): string {
                throw new Error("boom");
            },
            withSyncMetadataFactory({ use: () => logger })<[], string>(),
        );

        expect(() => fn()).toThrow("boom");
    });
});
