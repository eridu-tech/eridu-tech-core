import { beforeEach, describe, expect, test, vi } from "vitest";

import { UnableToLogError } from "@/logger/contracts/_module-exports.js";
import { LoggerResolver } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

describe("class: LoggerResolver", () => {
    type Transports = "transport1" | "transport2" | "transport3";
    const transport1 = new NoOpLoggerTransport();
    const transport2 = new NoOpLoggerTransport();
    const resolver = new LoggerResolver<Transports>({
        transports: {
            transport1,
            transport2,
        },
        defaultTransport: "transport1",
    });
    resolver.init();

    const multiTransportResolver = new LoggerResolver<Transports>({
        transports: {
            transport1,
            transport2,
        },
        defaultTransport: ["transport1", "transport2"],
    });
    multiTransportResolver.init();

    const throwWhenAnyFailsResolver = new LoggerResolver<Transports>({
        transports: {
            transport1,
            transport2,
        },
        defaultTransport: ["transport1", "transport2"],
        throwWhenAllFail: false,
    });
    throwWhenAnyFailsResolver.init();

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("Method: use", () => {
        test("Should throw DefaultAdapterNotDefinedError when called without arguments and no default transport is configured", () => {
            const resolverWithoutDefaultTransport =
                new LoggerResolver<Transports>({
                    transports: {
                        transport1,
                        transport2,
                    },
                });

            expect(() => {
                resolverWithoutDefaultTransport.use();
            }).toThrow(DefaultAdapterNotDefinedError);
        });

        test("Should throw UnregisteredAdapterError when called with a transport name that is not registered", () => {
            expect(() => {
                resolver.use("transport3");
            }).toThrow(UnregisteredAdapterError);
        });

        test("Should return a logger of the registered transport when called with its name", () => {
            const logger = resolver.use("transport1");

            expect(() => {
                logger.info(["hello"]);
            }).not.toThrow();
            expect(logger.run(() => "value")).toBe("value");
        });

        test("Should call the default transport when called without arguments", () => {
            const transport1Spy = vi.spyOn(transport1, "log");
            const transport2Spy = vi.spyOn(transport2, "log");

            resolver.use().info(["hello"]);

            expect(transport1Spy).toHaveBeenCalledOnce();
            expect(transport2Spy).not.toHaveBeenCalled();
        });

        test("Should call the explicitly selected transport when called with its name", () => {
            const transport1Spy = vi.spyOn(transport1, "log");
            const transport2Spy = vi.spyOn(transport2, "log");

            resolver.use("transport2").info(["hello"]);

            expect(transport2Spy).toHaveBeenCalledOnce();
            expect(transport1Spy).not.toHaveBeenCalled();
        });

        describe("Multiple transports:", () => {
            test("Should call every selected transport when called with a list of names", () => {
                const transport1Spy = vi.spyOn(transport1, "log");
                const transport2Spy = vi.spyOn(transport2, "log");

                resolver.use(["transport1", "transport2"]).info(["hello"]);

                expect(transport1Spy).toHaveBeenCalledOnce();
                expect(transport2Spy).toHaveBeenCalledOnce();
                const [firstEntry] = transport1Spy.mock.calls[0] ?? [];
                const [secondEntry] = transport2Spy.mock.calls[0] ?? [];
                expect(firstEntry?.messages).toStrictEqual(
                    secondEntry?.messages,
                );
            });

            test("Should call every transport of the default list when called without arguments", () => {
                const transport1Spy = vi.spyOn(transport1, "log");
                const transport2Spy = vi.spyOn(transport2, "log");

                multiTransportResolver.use().info(["hello"]);

                expect(transport1Spy).toHaveBeenCalledOnce();
                expect(transport2Spy).toHaveBeenCalledOnce();
            });

            test("Should throw UnregisteredAdapterError when one of the given names is not registered", () => {
                expect(() => {
                    resolver.use(["transport1", "transport3"]);
                }).toThrow(UnregisteredAdapterError);
            });

            test("Should call the transports in the order the names were given", () => {
                const transport1Spy = vi.spyOn(transport1, "log");
                const transport2Spy = vi.spyOn(transport2, "log");

                resolver.use(["transport2", "transport1"]).info(["hello"]);

                const transport2Order = transport2Spy.mock
                    .invocationCallOrder[0] as number;
                const transport1Order = transport1Spy.mock
                    .invocationCallOrder[0] as number;
                expect(transport2Order).toBeLessThan(transport1Order);
            });

            test("Should not throw when only some transports fail and throwWhenAllFail is true", () => {
                vi.spyOn(transport1, "log").mockImplementation(() => {
                    throw new Error("first");
                });
                const transport2Spy = vi.spyOn(transport2, "log");

                expect(() => {
                    multiTransportResolver.use().info(["hello"]);
                }).not.toThrow();
                expect(transport2Spy).toHaveBeenCalledOnce();
            });

            test("Should throw every failure when all transports fail and throwWhenAllFail is true", () => {
                const firstError = new Error("first");
                const secondError = new Error("second");
                vi.spyOn(transport1, "log").mockImplementation(() => {
                    throw firstError;
                });
                vi.spyOn(transport2, "log").mockImplementation(() => {
                    throw secondError;
                });

                let thrown: unknown;
                try {
                    multiTransportResolver.use().info(["hello"]);
                } catch (error: unknown) {
                    thrown = error;
                }

                expect(thrown).toBeInstanceOf(UnableToLogError);
                const aggregate = (thrown as UnableToLogError).cause;
                expect(aggregate).toBeInstanceOf(AggregateError);
                expect((aggregate as AggregateError).errors).toStrictEqual([
                    firstError,
                    secondError,
                ]);
            });

            test("Should throw as soon as one transport fails and throwWhenAllFail is false", () => {
                const firstError = new Error("first");
                vi.spyOn(transport1, "log").mockImplementation(() => {
                    throw firstError;
                });
                const transport2Spy = vi.spyOn(transport2, "log");

                let thrown: unknown;
                try {
                    throwWhenAnyFailsResolver.use().info(["hello"]);
                } catch (error: unknown) {
                    thrown = error;
                }

                expect(thrown).toBeInstanceOf(UnableToLogError);
                const aggregate = (thrown as UnableToLogError).cause;
                expect(aggregate).toBeInstanceOf(AggregateError);
                expect((aggregate as AggregateError).errors).toStrictEqual([
                    firstError,
                ]);
                expect(transport2Spy).toHaveBeenCalledOnce();
            });
        });
    });
});
