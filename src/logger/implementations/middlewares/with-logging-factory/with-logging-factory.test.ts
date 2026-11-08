import { afterEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { withLoggingFactory } from "@/logger/implementations/middlewares/with-logging-factory/with-logging-factory.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

describe("function: withLoggingFactory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Should select the transport passed to use", async () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({ transport });
        const loggerResolver = {
            use: vi.fn((_transportName?: "primary" | "secondary") => logger),
        };
        const fn = use(function handler(): Promise<string> {
            return Promise.resolve("ok");
        }, withLoggingFactory(loggerResolver).use("secondary")<[], string>());

        await fn();

        expect(loggerResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        expect(logSpy).toHaveBeenCalledTimes(3);
    });

    test("Should log the function name, arguments, and return value", async () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({ transport });

        const fn = use(
            function handler(first: number, second: number): Promise<number> {
                return Promise.resolve(first + second);
            },
            withLoggingFactory({ use: () => logger })<
                [number, number],
                number
            >(),
        );

        await fn(1, 2);

        expect(logSpy).toHaveBeenCalledTimes(3);
        expect(logSpy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                level: LOG_LEVEL.INFO,
                messages: ["function:", "handler"],
            }),
        );
        expect(logSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                level: LOG_LEVEL.INFO,
                messages: ["args:", [1, 2]],
            }),
        );
        expect(logSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                level: LOG_LEVEL.INFO,
                messages: ["return:", 3],
            }),
        );
    });

    test("Should log the class name before the function name when className is set", async () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({ transport });

        const fn = use(
            function handler(first: number, second: number): Promise<number> {
                return Promise.resolve(first + second);
            },
            withLoggingFactory({ use: () => logger })<[number, number], number>(
                {
                    className: "MathService",
                },
            ),
        );

        await fn(1, 2);

        expect(logSpy).toHaveBeenCalledTimes(4);
        expect(logSpy).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                level: LOG_LEVEL.INFO,
                messages: ["class:", "MathService"],
            }),
        );
        expect(logSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                level: LOG_LEVEL.INFO,
                messages: ["function:", "handler"],
            }),
        );
    });

    test("Should return the resolved value of the wrapped function", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });

        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("result");
            },
            withLoggingFactory({ use: () => logger })<[], string>(),
        );

        await expect(fn()).resolves.toBe("result");
    });

    test("Should pass the original arguments to the wrapped function", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const wrappedFn = vi.fn(
            (first: string, second: string): Promise<string> =>
                Promise.resolve(`${first} ${second}`),
        );

        const fn = use(
            wrappedFn,
            withLoggingFactory({ use: () => logger })<
                [string, string],
                string
            >(),
        );

        await fn("Ada", "Lovelace");

        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("Ada", "Lovelace");
    });

    test("Should log the error at the error level by default and rethrow", async () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({ transport });

        const fn = use(
            function handler(): Promise<string> {
                return Promise.reject(new Error("boom"));
            },
            withLoggingFactory({ use: () => logger })<[], string>(),
        );

        await expect(fn()).rejects.toThrow("boom");

        expect(logSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                level: LOG_LEVEL.ERROR,
                messages: ["error:", expect.any(Error) as Error],
            }),
        );
    });

    test("Should log the error at the fatal level when useFatalLevel is enabled", async () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({ transport });

        const fn = use(
            function handler(): Promise<string> {
                return Promise.reject(new Error("boom"));
            },
            withLoggingFactory({ use: () => logger })<[], string>({
                useFatalLevel: true,
            }),
        );

        await expect(fn()).rejects.toThrow("boom");

        expect(logSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                level: LOG_LEVEL.FATAL,
                messages: ["fatal:", expect.any(Error) as Error],
            }),
        );
    });

    test("Should not log an error when the wrapped function resolves", async () => {
        const transport = new NoOpLoggerTransport();
        const logSpy = vi.spyOn(transport, "log");
        const logger = new Logger({ transport });

        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("ok");
            },
            withLoggingFactory({ use: () => logger })<[], string>({
                useFatalLevel: true,
            }),
        );

        await fn();

        const levels = logSpy.mock.calls.map(([data]) => data.level);
        expect(levels).toStrictEqual([
            LOG_LEVEL.INFO,
            LOG_LEVEL.INFO,
            LOG_LEVEL.INFO,
        ]);
    });
});
