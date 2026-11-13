import { beforeEach, describe, expect, test, vi } from "vitest";

import { UnableToLogError } from "@/log/contracts/_module-exports.js";
import { LogResolver } from "@/log/implementations/derivables/_module-exports.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

describe("class: LogResolver", () => {
    type Transports = "transport1" | "transport2" | "transport3";
    const transport1 = new NoOpLogTransport();
    const transport2 = new NoOpLogTransport();
    const resolver = new LogResolver<Transports>({
        transports: {
            transport1,
            transport2,
        },
        defaultTransport: "transport1",
    });
    resolver.init();

    const multiTransportResolver = new LogResolver<Transports>({
        transports: {
            transport1,
            transport2,
        },
        defaultTransport: ["transport1", "transport2"],
    });
    multiTransportResolver.init();

    const throwWhenAnyFailsResolver = new LogResolver<Transports>({
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
            const resolverWithoutDefaultTransport = new LogResolver<Transports>(
                {
                    transports: {
                        transport1,
                        transport2,
                    },
                },
            );

            expect(() => {
                resolverWithoutDefaultTransport.use();
            }).toThrow(DefaultAdapterNotDefinedError);
        });

        test("Should throw UnregisteredAdapterError when called with a transport name that is not registered", () => {
            expect(() => {
                resolver.use("transport3");
            }).toThrow(UnregisteredAdapterError);
        });

        test("Should return a log of the registered transport when called with its name", () => {
            const log = resolver.use("transport1");

            expect(() => {
                log.info(["hello"]);
            }).not.toThrow();
            expect(log.run(() => "value")).toBe("value");
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
