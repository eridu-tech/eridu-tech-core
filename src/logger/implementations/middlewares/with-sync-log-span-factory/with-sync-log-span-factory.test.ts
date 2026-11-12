import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { withSyncLogSpanFactory } from "@/logger/implementations/middlewares/with-sync-log-span-factory/with-sync-log-span-factory.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { Mock } from "vitest";

describe("function: withSyncLogSpanFactory", () => {
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
        const runSpy = vi.spyOn(logger, "run");
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
        expect(runSpy).toHaveBeenCalledExactlyOnceWith(expect.any(Function), {
            span: "db",
        });
    });

    test("Should open a span named after the middleware label", () => {
        const fn = use(
            (name: string): string => {
                logger.info(["inside"]);
                return name;
            },
            withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                "db",
            ),
        );

        fn("query");

        expect(logSpy).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                messages: ["inside"],
                spans: { db: expect.any(TimeSpan) as TimeSpan },
            }),
        );
    });

    test("Should not attach the span to entries logged after the call", () => {
        const fn = use(
            (name: string): string => name,
            withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                "db",
            ),
        );

        fn("query");
        logger.info(["after"]);

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.spans).toBeUndefined();
    });

    test("Should nest the spans of stacked middlewares", () => {
        const fn = use(
            (_name: string): string => {
                logger.info(["inside"]);
                return "ok";
            },
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

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(Object.keys(entry?.spans ?? {}).sort()).toStrictEqual([
            "db",
            "http",
        ]);
    });

    test("Should not set the other extra info of the entry", () => {
        const fn = use(
            (name: string): string => {
                logger.info(["inside"]);
                return name;
            },
            withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                "db",
            ),
        );

        fn("query");

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.group).toBeUndefined();
        expect(entry?.metadata).toBeUndefined();
        expect(entry?.error).toBeUndefined();
    });

    test("Should return the value of the wrapped function synchronously", () => {
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

    test("Should open a span for every invocation", () => {
        const fn = use(
            (_name: string): string => {
                logger.info(["inside"]);
                return "ok";
            },
            withSyncLogSpanFactory({ use: () => logger })<[string], string>(
                "db",
            ),
        );

        fn("first");
        fn("second");

        expect(logSpy).toHaveBeenCalledTimes(2);
        for (const [entry] of logSpy.mock.calls) {
            expect(entry.spans).toStrictEqual({
                db: expect.any(TimeSpan) as TimeSpan,
            });
        }
    });

    test("Should propagate an error from the wrapped function", () => {
        const fn = use(
            (): string => {
                throw new Error("boom");
            },
            withSyncLogSpanFactory({ use: () => logger })<[], string>("db"),
        );

        expect(() => fn()).toThrow("boom");
    });
});
