import { beforeEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { withSyncLoggingFactory } from "@/logger/implementations/middlewares/with-sync-logging-factory/with-sync-logging-factory.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

import type { Mock } from "vitest";

describe("function: withSyncLoggingFactory", () => {
    const transport = new NoOpLoggerTransport();
    const logger = new Logger({ transport });
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
        const fn = use(function handler(): string {
            return "ok";
        }, withSyncLoggingFactory(loggerResolver).use("secondary")<[], string>());

        fn();

        expect(loggerResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        expect(logSpy).toHaveBeenCalledTimes(3);
    });

    test("Should log the function name, arguments, and return value", () => {
        const fn = use(
            function handler(first: number, second: number): number {
                return first + second;
            },
            withSyncLoggingFactory({ use: () => logger })<
                [number, number],
                number
            >(),
        );

        fn(1, 2);

        expect(logSpy).toHaveBeenCalledTimes(3);
        expect(logSpy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                level: LOG_LEVEL.VERBOSE,
                messages: ["function:", "handler"],
            }),
        );
        expect(logSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                level: LOG_LEVEL.VERBOSE,
                messages: ["args:", "1, 2"],
            }),
        );
        expect(logSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                level: LOG_LEVEL.VERBOSE,
                messages: ["return:", 3],
            }),
        );
    });

    test("Should join the arguments with a comma", () => {
        const fn = use(
            function handler(first: string, second: string): string {
                return first + second;
            },
            withSyncLoggingFactory({ use: () => logger })<
                [string, string],
                string
            >(),
        );

        fn("Ada", "Lovelace");

        expect(logSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                messages: ["args:", "Ada, Lovelace"],
            }),
        );
    });

    test("Should log the class name before the function name when className is set", () => {
        const fn = use(
            function handler(first: number, second: number): number {
                return first + second;
            },
            withSyncLoggingFactory({ use: () => logger })<
                [number, number],
                number
            >({
                className: "MathService",
            }),
        );

        fn(1, 2);

        expect(logSpy).toHaveBeenCalledTimes(4);
        expect(logSpy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                level: LOG_LEVEL.VERBOSE,
                messages: ["class:", "MathService"],
            }),
        );
        expect(logSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                level: LOG_LEVEL.VERBOSE,
                messages: ["function:", "handler"],
            }),
        );
    });

    test("Should return the value of the wrapped function synchronously", () => {
        const fn = use(
            function handler(name: string): string {
                return `Hello ${name}`;
            },
            withSyncLoggingFactory({ use: () => logger })<[string], string>(),
        );

        const result = fn("world");

        expect(result).toBe("Hello world");
        expect(result).not.toBeInstanceOf(Promise);
    });

    test("Should pass the original arguments to the wrapped function", () => {
        const wrappedFn = vi.fn(
            (firstName: string, lastName: string): string =>
                `${firstName} ${lastName}`,
        );

        const fn = use(
            wrappedFn,
            withSyncLoggingFactory({ use: () => logger })<
                [string, string],
                string
            >(),
        );

        fn("Ada", "Lovelace");

        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("Ada", "Lovelace");
    });

    test("Should log the error at the error level by default and rethrow", () => {
        const error = new Error("boom");

        const fn = use(
            function handler(): string {
                throw error;
            },
            withSyncLoggingFactory({ use: () => logger })<[], string>(),
        );

        expect(() => fn()).toThrow(error);

        expect(logSpy).toHaveBeenCalledTimes(3);
        expect(logSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                level: LOG_LEVEL.ERROR,
                messages: ["error:"],
                error,
            }),
        );
    });

    test("Should log the error at the fatal level when useFatalLevel is enabled", () => {
        const error = new Error("boom");

        const fn = use(
            function handler(): string {
                throw error;
            },
            withSyncLoggingFactory({ use: () => logger })<[], string>({
                useFatalLevel: true,
            }),
        );

        expect(() => fn()).toThrow(error);

        expect(logSpy).toHaveBeenCalledTimes(3);
        expect(logSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                level: LOG_LEVEL.FATAL,
                messages: ["fatal:"],
                error,
            }),
        );
    });

    test("Should not log the return value when the wrapped function throws", () => {
        const fn = use(
            function handler(): string {
                throw new Error("boom");
            },
            withSyncLoggingFactory({ use: () => logger })<[], string>(),
        );

        expect(() => fn()).toThrow("boom");

        const messages = logSpy.mock.calls.map(([data]) => data.messages[0]);
        expect(messages).toStrictEqual(["function:", "args:", "error:"]);
    });

    test("Should not log an error when the wrapped function succeeds", () => {
        const fn = use(
            function handler(): string {
                return "ok";
            },
            withSyncLoggingFactory({ use: () => logger })<[], string>({
                useFatalLevel: true,
            }),
        );

        fn();

        const levels = logSpy.mock.calls.map(([data]) => data.level);
        expect(levels).toStrictEqual([
            LOG_LEVEL.VERBOSE,
            LOG_LEVEL.VERBOSE,
            LOG_LEVEL.VERBOSE,
        ]);
    });
});
