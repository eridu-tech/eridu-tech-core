import { describe, expect, test, vi } from "vitest";

import { UnableToLogError } from "@/logger/contracts/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/logger/_module.js";
import { ComposedLogger } from "@/logger/implementations/derivables/logger-resolver/composed-logger.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";

const LEVELS = ["debug", "verbose", "info", "warn", "error", "fatal"] as const;
const FAILURE_LEVELS = ["warn", "error", "fatal"] as const;

describe("class: ComposedLogger", () => {
    test.each(LEVELS)("Should forward %s to each logger", (method) => {
        const first = new Logger({ transport: new NoOpLoggerTransport() });
        const second = new Logger({ transport: new NoOpLoggerTransport() });
        const firstSpy = vi.spyOn(first, method);
        const secondSpy = vi.spyOn(second, method);
        const composed = new ComposedLogger([first, second], true);
        const metadata = { requestId: "r1" };

        composed[method](["hello"], { group: "auth", metadata });

        expect(firstSpy).toHaveBeenCalledExactlyOnceWith(["hello"], {
            group: "auth",
            metadata,
        });
        expect(secondSpy).toHaveBeenCalledExactlyOnceWith(["hello"], {
            group: "auth",
            metadata,
        });
    });

    test.each(FAILURE_LEVELS)(
        "Should forward the failure details of %s to each logger",
        (method) => {
            const first = new Logger({ transport: new NoOpLoggerTransport() });
            const second = new Logger({ transport: new NoOpLoggerTransport() });
            const firstSpy = vi.spyOn(first, method);
            const secondSpy = vi.spyOn(second, method);
            const composed = new ComposedLogger([first, second], true);
            const error = new Error("card_declined");

            composed[method](["payment failed"], { error });

            expect(firstSpy).toHaveBeenCalledExactlyOnceWith(
                ["payment failed"],
                { error },
            );
            expect(secondSpy).toHaveBeenCalledExactlyOnceWith(
                ["payment failed"],
                { error },
            );
        },
    );

    test("Should forward putMetadata values to each logger", () => {
        const first = new Logger({ transport: new NoOpLoggerTransport() });
        const second = new Logger({ transport: new NoOpLoggerTransport() });
        const firstSpy = vi.spyOn(first, "putMetadata");
        const secondSpy = vi.spyOn(second, "putMetadata");
        const composed = new ComposedLogger([first, second], true);
        const values = { requestId: "r1" };

        composed.putMetadata(values);

        expect(firstSpy).toHaveBeenCalledExactlyOnceWith(values);
        expect(secondSpy).toHaveBeenCalledExactlyOnceWith(values);
    });

    test("Should forward a putMetadata pair to each logger", () => {
        const first = new Logger({ transport: new NoOpLoggerTransport() });
        const second = new Logger({ transport: new NoOpLoggerTransport() });
        const firstSpy = vi.spyOn(first, "putMetadata");
        const secondSpy = vi.spyOn(second, "putMetadata");
        const composed = new ComposedLogger([first, second], true);

        composed.putMetadata("userId", "42");

        expect(firstSpy).toHaveBeenCalledExactlyOnceWith("userId", "42");
        expect(secondSpy).toHaveBeenCalledExactlyOnceWith("userId", "42");
    });

    test("Should return the result of the invocation", () => {
        const logger = new Logger({ transport: new NoOpLoggerTransport() });
        const composed = new ComposedLogger([logger], true);

        expect(composed.run(() => "value")).toBe("value");
    });

    test("Should invoke the invocation once for all loggers", () => {
        const first = new Logger({ transport: new NoOpLoggerTransport() });
        const second = new Logger({ transport: new NoOpLoggerTransport() });
        const composed = new ComposedLogger([first, second], true);
        const invocable = vi.fn(() => "value");

        expect(composed.run(invocable)).toBe("value");
        expect(invocable).toHaveBeenCalledTimes(1);
    });

    test("Should apply the run settings to each logger", () => {
        const first = new Logger({ transport: new NoOpLoggerTransport() });
        const second = new Logger({ transport: new NoOpLoggerTransport() });
        const firstSpy = vi.spyOn(first, "run");
        const secondSpy = vi.spyOn(second, "run");
        const composed = new ComposedLogger([first, second], true);
        const settings = { span: "db" };

        composed.run(() => {}, settings);

        expect(firstSpy).toHaveBeenCalledExactlyOnceWith(
            expect.any(Function),
            settings,
        );
        expect(secondSpy).toHaveBeenCalledExactlyOnceWith(
            expect.any(Function),
            settings,
        );
    });

    test.each([
        { throwWhenAllFail: true, failingLoggers: 1, shouldThrow: false },
        { throwWhenAllFail: true, failingLoggers: 2, shouldThrow: true },
        { throwWhenAllFail: false, failingLoggers: 1, shouldThrow: true },
        { throwWhenAllFail: false, failingLoggers: 2, shouldThrow: true },
    ])(
        "Should throw=$shouldThrow when $failingLoggers of 2 loggers fail and throwWhenAllFail=$throwWhenAllFail",
        ({ throwWhenAllFail, failingLoggers, shouldThrow }) => {
            const first = new Logger({ transport: new NoOpLoggerTransport() });
            const second = new Logger({ transport: new NoOpLoggerTransport() });
            const firstSpy = vi.spyOn(first, "info");
            const secondSpy = vi.spyOn(second, "info");
            const firstError = new Error("first");
            const secondError = new Error("second");
            firstSpy.mockImplementationOnce(() => {
                throw firstError;
            });
            if (failingLoggers === 2) {
                secondSpy.mockImplementationOnce(() => {
                    throw secondError;
                });
            }
            const composed = new ComposedLogger(
                [first, second],
                throwWhenAllFail,
            );

            let thrown: unknown;
            try {
                composed.info(["hello"]);
            } catch (caught: unknown) {
                thrown = caught;
            }

            expect(thrown instanceof UnableToLogError).toBe(shouldThrow);
            expect(firstSpy).toHaveBeenCalledOnce();
            expect(secondSpy).toHaveBeenCalledOnce();
        },
    );

    test.each([true, false] as const)(
        "Should aggregate the failures of every logger when throwWhenAllFail is %s",
        (throwWhenAllFail) => {
            const first = new Logger({ transport: new NoOpLoggerTransport() });
            const second = new Logger({ transport: new NoOpLoggerTransport() });
            const firstError = new Error("first");
            const secondError = new Error("second");
            vi.spyOn(first, "info").mockImplementationOnce(() => {
                throw firstError;
            });
            vi.spyOn(second, "info").mockImplementationOnce(() => {
                throw secondError;
            });
            const composed = new ComposedLogger(
                [first, second],
                throwWhenAllFail,
            );

            let thrown: unknown;
            try {
                composed.info(["hello"]);
            } catch (caught: unknown) {
                thrown = caught;
            }

            expect(thrown).toBeInstanceOf(UnableToLogError);
            const aggregate = (thrown as UnableToLogError).cause;
            expect(aggregate).toBeInstanceOf(AggregateError);
            expect((aggregate as AggregateError).errors).toEqual([
                firstError,
                secondError,
            ]);
        },
    );

    test.each([true, false] as const)(
        "Should unwrap the causes of logger failures when throwWhenAllFail is %s",
        (throwWhenAllFail) => {
            const first = new Logger({ transport: new NoOpLoggerTransport() });
            const second = new Logger({ transport: new NoOpLoggerTransport() });
            const firstCause = new Error("first");
            const secondCause = new Error("second");
            vi.spyOn(first, "info").mockImplementationOnce(() => {
                throw UnableToLogError.create(firstCause);
            });
            vi.spyOn(second, "info").mockImplementationOnce(() => {
                throw UnableToLogError.create(secondCause);
            });
            const composed = new ComposedLogger(
                [first, second],
                throwWhenAllFail,
            );

            let thrown: unknown;
            try {
                composed.info(["hello"]);
            } catch (caught: unknown) {
                thrown = caught;
            }

            expect(thrown).toBeInstanceOf(UnableToLogError);
            const aggregate = (thrown as UnableToLogError).cause;
            expect(aggregate).toBeInstanceOf(AggregateError);
            expect((aggregate as AggregateError).errors).toEqual([
                firstCause,
                secondCause,
            ]);
        },
    );

    test.each([
        { throwWhenAllFail: true, shouldThrow: true },
        { throwWhenAllFail: false, shouldThrow: false },
    ])(
        "Should throw=$shouldThrow when it has no loggers and throwWhenAllFail=$throwWhenAllFail",
        ({ throwWhenAllFail, shouldThrow }) => {
            const composed = new ComposedLogger([], throwWhenAllFail);

            let thrown: unknown;
            try {
                composed.info(["hello"]);
            } catch (caught: unknown) {
                thrown = caught;
            }

            expect(thrown instanceof UnableToLogError).toBe(shouldThrow);
            expect(() => {
                composed.putMetadata({ requestId: "r1" });
            }).not.toThrow();
            expect(composed.run(() => "value")).toBe("value");
        },
    );
});
