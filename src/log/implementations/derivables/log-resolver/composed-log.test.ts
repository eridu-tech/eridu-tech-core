import { describe, expect, test, vi } from "vitest";

import { UnableToLogError } from "@/log/contracts/_module-exports.js";
import { Log } from "@/log/implementations/derivables/log/_module.js";
import { ComposedLog } from "@/log/implementations/derivables/log-resolver/composed-log.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";

const LEVELS = ["debug", "verbose", "info", "warn", "error", "fatal"] as const;
const FAILURE_LEVELS = ["warn", "error", "fatal"] as const;

describe("class: ComposedLog", () => {
    test.each(LEVELS)("Should forward %s to each log", (method) => {
        const first = new Log({ transport: new NoOpLogTransport() });
        const second = new Log({ transport: new NoOpLogTransport() });
        const firstSpy = vi.spyOn(first, method);
        const secondSpy = vi.spyOn(second, method);
        const composed = new ComposedLog([first, second], true);
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
        "Should forward the failure details of %s to each log",
        (method) => {
            const first = new Log({ transport: new NoOpLogTransport() });
            const second = new Log({ transport: new NoOpLogTransport() });
            const firstSpy = vi.spyOn(first, method);
            const secondSpy = vi.spyOn(second, method);
            const composed = new ComposedLog([first, second], true);
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

    test("Should forward putMetadata values to each log", () => {
        const first = new Log({ transport: new NoOpLogTransport() });
        const second = new Log({ transport: new NoOpLogTransport() });
        const firstSpy = vi.spyOn(first, "putMetadata");
        const secondSpy = vi.spyOn(second, "putMetadata");
        const composed = new ComposedLog([first, second], true);
        const values = { requestId: "r1" };

        composed.putMetadata(values);

        expect(firstSpy).toHaveBeenCalledExactlyOnceWith(values);
        expect(secondSpy).toHaveBeenCalledExactlyOnceWith(values);
    });

    test("Should forward a putMetadata pair to each log", () => {
        const first = new Log({ transport: new NoOpLogTransport() });
        const second = new Log({ transport: new NoOpLogTransport() });
        const firstSpy = vi.spyOn(first, "putMetadata");
        const secondSpy = vi.spyOn(second, "putMetadata");
        const composed = new ComposedLog([first, second], true);

        composed.putMetadata("userId", "42");

        expect(firstSpy).toHaveBeenCalledExactlyOnceWith("userId", "42");
        expect(secondSpy).toHaveBeenCalledExactlyOnceWith("userId", "42");
    });

    test("Should return the result of the invocation", () => {
        const log = new Log({ transport: new NoOpLogTransport() });
        const composed = new ComposedLog([log], true);

        expect(composed.run(() => "value")).toBe("value");
    });

    test("Should invoke the invocation once for all logs", () => {
        const first = new Log({ transport: new NoOpLogTransport() });
        const second = new Log({ transport: new NoOpLogTransport() });
        const composed = new ComposedLog([first, second], true);
        const invocable = vi.fn(() => "value");

        expect(composed.run(invocable)).toBe("value");
        expect(invocable).toHaveBeenCalledTimes(1);
    });

    test("Should apply the run settings to each log", () => {
        const first = new Log({ transport: new NoOpLogTransport() });
        const second = new Log({ transport: new NoOpLogTransport() });
        const firstSpy = vi.spyOn(first, "run");
        const secondSpy = vi.spyOn(second, "run");
        const composed = new ComposedLog([first, second], true);
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
        { throwWhenAllFail: true, failingLogs: 1, shouldThrow: false },
        { throwWhenAllFail: true, failingLogs: 2, shouldThrow: true },
        { throwWhenAllFail: false, failingLogs: 1, shouldThrow: true },
        { throwWhenAllFail: false, failingLogs: 2, shouldThrow: true },
    ])(
        "Should throw=$shouldThrow when $failingLogs of 2 logs fail and throwWhenAllFail=$throwWhenAllFail",
        ({ throwWhenAllFail, failingLogs, shouldThrow }) => {
            const first = new Log({ transport: new NoOpLogTransport() });
            const second = new Log({ transport: new NoOpLogTransport() });
            const firstSpy = vi.spyOn(first, "info");
            const secondSpy = vi.spyOn(second, "info");
            const firstError = new Error("first");
            const secondError = new Error("second");
            firstSpy.mockImplementationOnce(() => {
                throw firstError;
            });
            if (failingLogs === 2) {
                secondSpy.mockImplementationOnce(() => {
                    throw secondError;
                });
            }
            const composed = new ComposedLog([first, second], throwWhenAllFail);

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
        "Should aggregate the failures of every log when throwWhenAllFail is %s",
        (throwWhenAllFail) => {
            const first = new Log({ transport: new NoOpLogTransport() });
            const second = new Log({ transport: new NoOpLogTransport() });
            const firstError = new Error("first");
            const secondError = new Error("second");
            vi.spyOn(first, "info").mockImplementationOnce(() => {
                throw firstError;
            });
            vi.spyOn(second, "info").mockImplementationOnce(() => {
                throw secondError;
            });
            const composed = new ComposedLog([first, second], throwWhenAllFail);

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
        "Should unwrap the causes of log failures when throwWhenAllFail is %s",
        (throwWhenAllFail) => {
            const first = new Log({ transport: new NoOpLogTransport() });
            const second = new Log({ transport: new NoOpLogTransport() });
            const firstCause = new Error("first");
            const secondCause = new Error("second");
            vi.spyOn(first, "info").mockImplementationOnce(() => {
                throw UnableToLogError.create(firstCause);
            });
            vi.spyOn(second, "info").mockImplementationOnce(() => {
                throw UnableToLogError.create(secondCause);
            });
            const composed = new ComposedLog([first, second], throwWhenAllFail);

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
        "Should throw=$shouldThrow when it has no logs and throwWhenAllFail=$throwWhenAllFail",
        ({ throwWhenAllFail, shouldThrow }) => {
            const composed = new ComposedLog([], throwWhenAllFail);

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
