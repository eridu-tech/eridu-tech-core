import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { withLogSpanFactory } from "@/log/implementations/middlewares/with-log-span-factory/with-log-span-factory.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { Mock } from "vitest";

describe("function: withLogSpanFactory", () => {
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
        const runSpy = vi.spyOn(log, "run");
        const logResolver = {
            use: vi.fn((_transportName?: "primary" | "secondary") => log),
        };
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withLogSpanFactory(logResolver).use("secondary")<[string], string>(
                "db",
            ),
        );

        await fn("query");

        expect(logResolver.use).toHaveBeenCalledExactlyOnceWith("secondary");
        expect(runSpy).toHaveBeenCalledExactlyOnceWith(expect.any(Function), {
            span: "db",
        });
    });

    test("Should open a span named after the middleware label", async () => {
        const fn = use(
            (name: string): Promise<string> => {
                log.info(["inside"]);
                return Promise.resolve(name);
            },
            withLogSpanFactory({ use: () => log })<[string], string>("db"),
        );

        await fn("query");

        expect(logSpy).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                messages: ["inside"],
                spans: { db: expect.any(TimeSpan) as TimeSpan },
            }),
        );
    });

    test("Should not attach the span to entries logged after the call", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(name),
            withLogSpanFactory({ use: () => log })<[string], string>("db"),
        );

        await fn("query");
        log.info(["after"]);

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.spans).toBeUndefined();
    });

    test("Should nest the spans of stacked middlewares", async () => {
        const fn = use(
            (_name: string): Promise<string> => {
                log.info(["inside"]);
                return Promise.resolve("ok");
            },
            [
                withLogSpanFactory({ use: () => log })<[string], string>("db"),
                withLogSpanFactory({ use: () => log })<[string], string>(
                    "http",
                ),
            ],
        );

        await fn("query");

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(Object.keys(entry?.spans ?? {}).sort()).toStrictEqual([
            "db",
            "http",
        ]);
    });

    test("Should not set the other extra info of the entry", async () => {
        const fn = use(
            (name: string): Promise<string> => {
                log.info(["inside"]);
                return Promise.resolve(name);
            },
            withLogSpanFactory({ use: () => log })<[string], string>("db"),
        );

        await fn("query");

        const [entry] = logSpy.mock.calls[0] ?? [];
        expect(entry?.group).toBeUndefined();
        expect(entry?.metadata).toBeUndefined();
        expect(entry?.error).toBeUndefined();
    });

    test("Should return the resolved value of the wrapped function", async () => {
        const fn = use(
            (name: string): Promise<string> => Promise.resolve(`Hello ${name}`),
            withLogSpanFactory({ use: () => log })<[string], string>("db"),
        );

        await expect(fn("world")).resolves.toBe("Hello world");
    });

    test("Should pass the original arguments to the wrapped function", async () => {
        const wrappedFn = vi.fn(
            (firstName: string, lastName: string): Promise<string> =>
                Promise.resolve(`${firstName} ${lastName}`),
        );
        const fn = use(
            wrappedFn,
            withLogSpanFactory({ use: () => log })<[string, string], string>(
                "db",
            ),
        );

        await fn("Ada", "Lovelace");

        expect(wrappedFn).toHaveBeenCalledExactlyOnceWith("Ada", "Lovelace");
    });

    test("Should open a span for every invocation", async () => {
        const fn = use(
            (_name: string): Promise<string> => {
                log.info(["inside"]);
                return Promise.resolve("ok");
            },
            withLogSpanFactory({ use: () => log })<[string], string>("db"),
        );

        await fn("first");
        await fn("second");

        expect(logSpy).toHaveBeenCalledTimes(2);
        for (const [entry] of logSpy.mock.calls) {
            expect(entry.spans).toStrictEqual({
                db: expect.any(TimeSpan) as TimeSpan,
            });
        }
    });

    test("Should propagate a rejection from the wrapped function", async () => {
        const fn = use(
            (): Promise<string> => Promise.reject(new Error("boom")),
            withLogSpanFactory({ use: () => log })<[], string>("db"),
        );

        await expect(fn()).rejects.toThrow("boom");
    });
});
