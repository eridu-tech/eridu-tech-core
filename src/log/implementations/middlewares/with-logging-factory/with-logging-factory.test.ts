import { beforeEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL } from "@/log/contracts/_module-exports.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { withLoggingFactory } from "@/log/implementations/middlewares/with-logging-factory/with-logging-factory.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

import type { Mock } from "vitest";

describe("function: withLoggingFactory", () => {
    const transport = new NoOpLogTransport();
    const log = new Log({ transport });
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
        const fn = use(function handler(): Promise<string> {
            return Promise.resolve("ok");
        }, withLoggingFactory(logResolver).use("secondary")<[], string>());

        await fn();

        expect(logResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        expect(logSpy).toHaveBeenCalledTimes(3);
    });

    test("Should log the function name, arguments, and return value", async () => {
        const fn = use(
            function handler(first: number, second: number): Promise<number> {
                return Promise.resolve(first + second);
            },
            withLoggingFactory({ use: () => log })<[number, number], number>(),
        );

        await fn(1, 2);

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

    test("Should join the arguments with a comma", async () => {
        const fn = use(
            function handler(first: string, second: string): Promise<string> {
                return Promise.resolve(first + second);
            },
            withLoggingFactory({ use: () => log })<[string, string], string>(),
        );

        await fn("Ada", "Lovelace");

        expect(logSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                messages: ["args:", "Ada, Lovelace"],
            }),
        );
    });

    test("Should log the class name before the function name when className is set", async () => {
        const fn = use(
            function handler(first: number, second: number): Promise<number> {
                return Promise.resolve(first + second);
            },
            withLoggingFactory({ use: () => log })<[number, number], number>({
                className: "MathService",
            }),
        );

        await fn(1, 2);

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

    test("Should return the resolved value of the wrapped function", async () => {
        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("result");
            },
            withLoggingFactory({ use: () => log })<[], string>(),
        );

        await expect(fn()).resolves.toBe("result");
    });

    test("Should pass the original arguments to the wrapped function", async () => {
        const wrappedFn = vi.fn(
            (first: string, second: string): Promise<string> =>
                Promise.resolve(`${first} ${second}`),
        );

        const fn = use(
            wrappedFn,
            withLoggingFactory({ use: () => log })<[string, string], string>(),
        );

        await fn("Ada", "Lovelace");

        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("Ada", "Lovelace");
    });

    test("Should log the error at the error level by default and rethrow", async () => {
        const error = new Error("boom");

        const fn = use(
            function handler(): Promise<string> {
                return Promise.reject(error);
            },
            withLoggingFactory({ use: () => log })<[], string>(),
        );

        await expect(fn()).rejects.toThrow(error);

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

    test("Should log the thrown error of a synchronous wrapper", async () => {
        const error = new Error("boom");

        const fn = use(
            function handler(): Promise<string> {
                throw error;
            },
            withLoggingFactory({ use: () => log })<[], string>(),
        );

        await expect(fn()).rejects.toThrow(error);

        expect(logSpy).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                level: LOG_LEVEL.ERROR,
                messages: ["error:"],
                error,
            }),
        );
    });

    test("Should log the error at the fatal level when useFatalLevel is enabled", async () => {
        const error = new Error("boom");

        const fn = use(
            function handler(): Promise<string> {
                return Promise.reject(error);
            },
            withLoggingFactory({ use: () => log })<[], string>({
                useFatalLevel: true,
            }),
        );

        await expect(fn()).rejects.toThrow(error);

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

    test("Should not log the return value when the wrapped function rejects", async () => {
        const fn = use(
            function handler(): Promise<string> {
                return Promise.reject(new Error("boom"));
            },
            withLoggingFactory({ use: () => log })<[], string>(),
        );

        await expect(fn()).rejects.toThrow("boom");

        const messages = logSpy.mock.calls.map(([data]) => data.messages[0]);
        expect(messages).toStrictEqual(["function:", "args:", "error:"]);
    });

    test("Should not log an error when the wrapped function resolves", async () => {
        const fn = use(
            function handler(): Promise<string> {
                return Promise.resolve("ok");
            },
            withLoggingFactory({ use: () => log })<[], string>({
                useFatalLevel: true,
            }),
        );

        await fn();

        const levels = logSpy.mock.calls.map(([data]) => data.level);
        expect(levels).toStrictEqual([
            LOG_LEVEL.VERBOSE,
            LOG_LEVEL.VERBOSE,
            LOG_LEVEL.VERBOSE,
        ]);
    });
});
