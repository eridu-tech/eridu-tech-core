import { afterEach, describe, expect, test, vi } from "vitest";

import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { withSyncLogSpanFactory } from "@/logger/implementations/middlewares/with-sync-log-span-factory/with-sync-log-span-factory.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

describe("function: withSyncLogSpanFactory", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Should select the transport passed to use", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const loggerResolver = {
            use: vi.fn((_transportName?: "primary" | "secondary") => logger),
        };
        const fn = use(
            (name: string): string => name,
            withSyncLogSpanFactory(loggerResolver).use("secondary")<
                [string],
                string
            >("db"),
        );

        fn("query");

        expect(loggerResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        expect(spanSpy).toHaveBeenCalledExactlyOnceWith(
            "db",
            expect.any(Function),
        );
    });

    test("Should open a span named after the middleware label", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const fn = use(
            (name: string): string => name,
            withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                "db",
            ),
        );

        fn("query");

        expect(spanSpy).toHaveBeenCalledExactlyOnceWith(
            "db",
            expect.any(Function),
        );
    });

    test("Should nest the spans of stacked middlewares", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const fn = use(
            (_name: string): string => "ok",
            [
                withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                    "db",
                ),
                withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                    "http",
                ),
            ],
        );

        fn("query");

        expect(spanSpy).toHaveBeenCalledTimes(2);
        expect(spanSpy).toHaveBeenNthCalledWith(1, "db", expect.any(Function));
        expect(spanSpy).toHaveBeenNthCalledWith(
            2,
            "http",
            expect.any(Function),
        );
    });

    test("Should return the value of the wrapped function synchronously", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const fn = use(
            (name: string): string => `Hello ${name}`,
            withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                "db",
            ),
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
            withSyncLogSpanFactory({ use: () => logger })<
                [string, string],
                string
            >("db"),
        );

        fn("Ada", "Lovelace");

        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("Ada", "Lovelace");
    });

    test("Should open the span before calling the wrapped function", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const wrappedFn = vi.fn((): string => "ok");
        const fn = use(
            wrappedFn,
            withSyncLogSpanFactory({ use: () => logger })<[], string>("db"),
        );

        fn();

        const [spanOrder] = spanSpy.mock.invocationCallOrder;
        const [fnOrder = -1] = wrappedFn.mock.invocationCallOrder;
        expect(spanOrder).toBeLessThan(fnOrder);
    });

    test("Should open a span for every invocation", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const fn = use(
            (_name: string): string => "ok",
            withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                "db",
            ),
        );

        fn("first");
        fn("second");

        expect(spanSpy).toHaveBeenCalledTimes(2);
    });

    test("Should propagate an error thrown by the wrapped function", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const spanSpy = vi.spyOn(logger, "span");
        const fn = use(
            (): string => {
                throw new Error("boom");
            },
            withSyncLogSpanFactory({ use: () => logger })<[], string>("db"),
        );

        expect(() => fn()).toThrow("boom");
        expect(spanSpy).toHaveBeenCalledTimes(1);
    });
});
