import { afterEach, describe, expect, test, vi } from "vitest";

import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { withLogSpanFactory } from "@/logger/implementations/middlewares/with-log-span-factory/with-log-span-factory.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

describe("function: withLogSpanFactory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Should select the transport passed to use", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const loggerResolver = {
            use: vi.fn((_transportName?: "primary" | "secondary") => logger),
        };
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withLogSpanFactory(loggerResolver).use("secondary")<
                [string],
                string
            >("db"),
        );

        await fn("query");

        expect(loggerResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        expect(spanSpy).toHaveBeenCalledExactlyOnceWith(
            "db",
            expect.any(Function),
        );
    });

    test("Should open a span named after the middleware label", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withLogSpanFactory({ use: () => logger })<[string], string>("db"),
        );

        await fn("query");

        expect(spanSpy).toHaveBeenCalledExactlyOnceWith(
            "db",
            expect.any(Function),
        );
    });

    test("Should nest the spans of stacked middlewares", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const fn = use(
            (_name: string): Promise<string> => Promise.resolve("ok"),
            [
                withLogSpanFactory({ use: () => logger })<[string], string>(
                    "db",
                ),
                withLogSpanFactory({ use: () => logger })<[string], string>(
                    "http",
                ),
            ],
        );

        await fn("query");

        expect(spanSpy).toHaveBeenCalledTimes(2);
        expect(spanSpy).toHaveBeenNthCalledWith(1, "db", expect.any(Function));
        expect(spanSpy).toHaveBeenNthCalledWith(
            2,
            "http",
            expect.any(Function),
        );
    });

    test("Should return the resolved value of the wrapped function", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withLogSpanFactory({ use: () => logger })<[string], string>("db"),
        );

        await expect(fn("world")).resolves.toBe("Hello world");
    });

    test("Should pass the original arguments to the wrapped function", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const wrappedFn = vi.fn(
            (firstName: string, lastName: string): Promise<string> =>
                Promise.resolve(`${firstName} ${lastName}`),
        );
        const fn = use(
            wrappedFn,
            withLogSpanFactory({ use: () => logger })<[string, string], string>(
                "db",
            ),
        );

        await fn("Ada", "Lovelace");

        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("Ada", "Lovelace");
    });

    test("Should open the span before calling the wrapped function", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const wrappedFn = vi.fn((): Promise<string> => Promise.resolve("ok"));
        const fn = use(
            wrappedFn,
            withLogSpanFactory({ use: () => logger })<[], string>("db"),
        );

        await fn();

        const [spanOrder] = spanSpy.mock.invocationCallOrder;
        const [fnOrder = -1] = wrappedFn.mock.invocationCallOrder;
        expect(spanOrder).toBeLessThan(fnOrder);
    });

    test("Should open a span for every invocation", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const fn = use(
            (_name: string): Promise<string> => Promise.resolve("ok"),
            withLogSpanFactory({ use: () => logger })<[string], string>("db"),
        );

        await fn("first");
        await fn("second");

        expect(spanSpy).toHaveBeenCalledTimes(2);
    });

    test("Should propagate a rejection from the wrapped function", async () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const fn = use(
            (): Promise<string> => Promise.reject(new Error("boom")),
            withLogSpanFactory({ use: () => logger })<[], string>("db"),
        );

        await expect(fn()).rejects.toThrow("boom");
        expect(spanSpy).toHaveBeenCalledTimes(1);
    });
});
