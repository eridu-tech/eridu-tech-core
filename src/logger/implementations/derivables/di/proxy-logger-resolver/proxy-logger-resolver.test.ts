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

type Transports = "transport1" | "transport2";

describe("class: ProxyLoggerResolver", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("LIFETIME.SINGLETON:", () => {
        let executionContext: ExecutionContext;
        let transport1: NoOpLoggerTransport;
        let transport2: NoOpLoggerTransport;
        let proxyLoggerResolver: ProxyLoggerResolver<Transports>;

        beforeEach(async () => {
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

        test("Should delegate every level method to the default transport:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.debug(["a"]);
            proxyLoggerResolver.verbose(["b"]);
            proxyLoggerResolver.info(["c"]);
            proxyLoggerResolver.warn(["d"]);
            proxyLoggerResolver.error(["e"]);
            proxyLoggerResolver.fatal(["f"]);

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

            proxyLoggerResolver.use("transport2").info(["hello"]);

            expect(log2).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ messages: ["hello"] }),
            );
            expect(log1).not.toHaveBeenCalled();
        });

        test("Should delegate run and return its value:", () => {
            expect(proxyLoggerResolver.run(() => 42)).toBe(42);
        });

        test("Should attach the span of the run scope:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.run(
                () => {
                    proxyLoggerResolver.info(["inside"]);
                },
                { span: "db" },
            );

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    spans: { db: expect.any(TimeSpan) as TimeSpan },
                }),
            );
        });

        test("Should attach the metadata of the run scope:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.run(
                () => {
                    proxyLoggerResolver.info(["inside"]);
                },
                { metadata: { requestId: "r1" } },
            );

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1" },
                }),
            );
        });

        test("Should attach the group of the run scope:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.run(
                () => {
                    proxyLoggerResolver.info(["inside"]);
                },
                { group: "auth" },
            );

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    group: "auth",
                }),
            );
        });

        test("Should not attach the span to entries logged after the run returns:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.run(() => {}, { span: "db" });
            proxyLoggerResolver.info(["after"]);

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["after"],
                    spans: undefined,
                }),
            );
        });

        test("Should forward the extra info of the entry:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLoggerResolver.info(["inside"], {
                group: "auth",
                metadata: { userId: "42" },
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    group: "auth",
                    metadata: { userId: "42" },
                }),
            );
        });

        test("Should forward the error details of a failure level:", () => {
            const logSpy = vi.spyOn(transport1, "log");
            const error = new Error("timeout");

            proxyLoggerResolver.error(["failed"], { error });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["failed"],
                    error,
                }),
            );
        });

        test("Should delegate putMetadata with both forms:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            executionContext.run(() => {
                proxyLoggerResolver.putMetadata({ requestId: "r1" });
                proxyLoggerResolver.putMetadata("userId", "u1");
                proxyLoggerResolver.info(["inside"]);
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
        let transientProxyLoggerResolver: ProxyLoggerResolver<Transports>;
        let transientTransport: NoOpLoggerTransport;
        let resolveCount: number;

        beforeEach(async () => {
            const transientExecutionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            transientTransport = new NoOpLoggerTransport();
            const container = new Container({
                executionContext: transientExecutionContext,
            });
            resolveCount = 0;
            const factory = () => {
                resolveCount++;
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
            };
            container.registerFactory({
                token: LoggerResolver,
                factory,
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            transientProxyLoggerResolver = new ProxyLoggerResolver<Transports>({
                container,
                resolverToken: LoggerResolver,
            });

            await container.init();
        });

        test("Should resolve the resolver on every operation:", () => {
            transientProxyLoggerResolver.info(["first"]);
            transientProxyLoggerResolver.info(["second"]);

            expect(resolveCount).toBe(2);
        });

        test("Should not share the run scope between operations:", () => {
            const logSpy = vi.spyOn(transientTransport, "log");

            transientProxyLoggerResolver.run(
                () => {
                    transientProxyLoggerResolver.info(["inside"]);
                },
                { metadata: { requestId: "r1" }, span: "db" },
            );

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: undefined,
                    spans: undefined,
                }),
            );
        });
    });

    describe("LIFETIME.SCOPED:", () => {
        test("Should resolve the resolver inside the active scope:", async () => {
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
                    scopedProxyLoggerResolver.info(["inside"]);
                },
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ messages: ["inside"] }),
            );
        });

        test("Should share the run scope within the active scope:", async () => {
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
                    scopedProxyLoggerResolver.run(
                        () => {
                            scopedProxyLoggerResolver.info(["inside"]);
                        },
                        { metadata: { requestId: "r1" } },
                    );
                },
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1" },
                }),
            );
        });
    });
});
