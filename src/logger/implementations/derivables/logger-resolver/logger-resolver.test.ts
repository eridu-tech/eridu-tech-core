import { beforeEach, describe, expect, test, vi } from "vitest";

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
    });
});
