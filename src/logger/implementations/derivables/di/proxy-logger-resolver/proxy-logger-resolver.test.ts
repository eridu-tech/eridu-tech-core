import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { LoggerResolver } from "@/logger/implementations/derivables/_module-exports.js";
import { ProxyLoggerResolver } from "@/logger/implementations/derivables/di/proxy-logger-resolver/proxy-logger-resolver.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

describe("class: ProxyLoggerResolver", () => {
    type Transports = "transport1" | "transport2";

    let executionContext: ExecutionContext;
    let transport1: NoOpLoggerTransport;
    let transport2: NoOpLoggerTransport;
    let proxyLoggerResolver: ProxyLoggerResolver<Transports>;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            transport1 = new NoOpLoggerTransport();
            transport2 = new NoOpLoggerTransport();

            const container = new Container({ executionContext });
            container.registerFactory({
                token: LoggerResolver,
                factory: () => {
                    return new LoggerResolver<Transports>({
                        transports: {
                            transport1,
                            transport2,
                        },
                        defaultTransport: "transport1",
                        executionContext,
                    });
                },
                onInit: (resolver) => {
                    resolver.init();
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            proxyLoggerResolver = new ProxyLoggerResolver<Transports>({
                container,
                resolverToken: LoggerResolver,
            });

            await container.init();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        test("Should delegate every level method to the default transport:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.debug("a");
            proxyLoggerResolver.verbose("b");
            proxyLoggerResolver.info("c");
            proxyLoggerResolver.warn("d");
            proxyLoggerResolver.error("e");
            proxyLoggerResolver.fatal("f");

            const levels = logSpy.mock.calls.map(([data]) => {
                return data.level;
            });
            expect(levels).toStrictEqual([
                LOG_LEVEL.DEBUG,
                LOG_LEVEL.VERBOSE,
                LOG_LEVEL.INFO,
                LOG_LEVEL.WARN,
                LOG_LEVEL.ERROR,
                LOG_LEVEL.FATAL,
            ]);
        });

        test("Should use the selected transport:", () => {
            const log1 = vi.spyOn(transport1, "log");
            const log2 = vi.spyOn(transport2, "log");

            proxyLoggerResolver.use("transport2").info("hello");

            expect(log2).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ messages: ["hello"] }),
            );
            expect(log1).not.toHaveBeenCalled();
        });

        test("Should delegate span and return its value:", () => {
            expect(
                proxyLoggerResolver.span("db", () => {
                    return 42;
                }),
            ).toBe(42);
        });

        test("Should attach spans through the resolved logger:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.span("db", () => {
                proxyLoggerResolver.info("inside");
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    spans: { db: expect.any(TimeSpan) as TimeSpan },
                }),
            );
        });

        test("Should delegate scopedMetadata with the values form:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.scopedMetadata({ requestId: "r1" }, () => {
                proxyLoggerResolver.info("inside");
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1" },
                }),
            );
        });

        test("Should delegate scopedMetadata with the key-value form:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.scopedMetadata("requestId", "r1", () => {
                proxyLoggerResolver.info("inside");
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1" },
                }),
            );
        });

        test("Should delegate putMetadata with both forms:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            executionContext.run(() => {
                proxyLoggerResolver.putMetadata({ requestId: "r1" });
                proxyLoggerResolver.putMetadata("userId", "u1");
                proxyLoggerResolver.info("inside");
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1", userId: "u1" },
                }),
            );
        });
    });

    describe("LIFETIME.TRANSIENT:", () => {
        test("Should resolve the resolver on every operation:", async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const transientExecutionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transientTransport = new NoOpLoggerTransport();
            const container = new Container({
                executionContext: transientExecutionContext,
            });
            const factory = vi.fn(() => {
                const resolver = new LoggerResolver<Transports>({
                    transports: {
                        transport1: transientTransport,
                        transport2: transientTransport,
                    },
                    defaultTransport: "transport1",
                    executionContext: transientExecutionContext,
                });
                resolver.init();
                return resolver;
            });
            container.registerFactory({
                token: LoggerResolver,
                factory,
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            const transientProxyLoggerResolver =
                new ProxyLoggerResolver<Transports>({
                    container,
                    resolverToken: LoggerResolver,
                });
            await container.init();

            transientProxyLoggerResolver.info("first");
            transientProxyLoggerResolver.info("second");

            expect(factory).toHaveBeenCalledTimes(2);
        });
    });

    describe("LIFETIME.SCOPED:", () => {
        test("Should resolve the resolver inside the active scope:", async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const scopedExecutionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const scopedTransport = new NoOpLoggerTransport();
            const container = new Container({
                executionContext: scopedExecutionContext,
            });
            container.registerFactory({
                token: LoggerResolver,
                factory: () => {
                    const resolver = new LoggerResolver<Transports>({
                        transports: {
                            transport1: scopedTransport,
                            transport2: scopedTransport,
                        },
                        defaultTransport: "transport1",
                        executionContext: scopedExecutionContext,
                    });
                    resolver.init();
                    return resolver;
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            const scopedProxyLoggerResolver =
                new ProxyLoggerResolver<Transports>({
                    container,
                    resolverToken: LoggerResolver,
                });
            await container.init();
            const logSpy = vi.spyOn(scopedTransport, "log");

            await container.run({
                scope: () => {
                    scopedProxyLoggerResolver.info("inside");
                },
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ messages: ["inside"] }),
            );
        });
    });
});
