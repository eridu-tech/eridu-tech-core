import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { LOG_LEVEL } from "@/log/contracts/_module-exports.js";
import { LogResolver } from "@/log/implementations/derivables/_module-exports.js";
import { ProxyLogResolver } from "@/log/implementations/derivables/di/proxy-log-resolver/proxy-log-resolver.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

type Transports = "transport1" | "transport2";

describe("class: ProxyLogResolver", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("LIFETIME.SINGLETON:", () => {
        let executionContext: ExecutionContext;
        let transport1: NoOpLogTransport;
        let transport2: NoOpLogTransport;
        let proxyLogResolver: ProxyLogResolver<Transports>;

        beforeEach(async () => {
            executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            transport1 = new NoOpLogTransport();
            transport2 = new NoOpLogTransport();

            const container = new Container({ executionContext });
            container.registerFactory({
                token: LogResolver,
                factory: () => {
                    return new LogResolver<Transports>({
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
            proxyLogResolver = new ProxyLogResolver<Transports>({
                container,
                resolverToken: LogResolver,
            });

            await container.init();
        });

        test("Should delegate every level method to the default transport:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLogResolver.debug(["a"]);
            proxyLogResolver.verbose(["b"]);
            proxyLogResolver.info(["c"]);
            proxyLogResolver.warn(["d"]);
            proxyLogResolver.error(["e"]);
            proxyLogResolver.fatal(["f"]);

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

            proxyLogResolver.use("transport2").info(["hello"]);

            expect(log2).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({ messages: ["hello"] }),
            );
            expect(log1).not.toHaveBeenCalled();
        });

        test("Should delegate run and return its value:", () => {
            expect(proxyLogResolver.run(() => 42)).toBe(42);
        });

        test("Should attach the span of the run scope:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLogResolver.run(
                () => {
                    proxyLogResolver.info(["inside"]);
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

            proxyLogResolver.run(
                () => {
                    proxyLogResolver.info(["inside"]);
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

            proxyLogResolver.run(
                () => {
                    proxyLogResolver.info(["inside"]);
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

            proxyLogResolver.run(() => {}, { span: "db" });
            proxyLogResolver.info(["after"]);

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["after"],
                    spans: undefined,
                }),
            );
        });

        test("Should forward the extra info of the entry:", () => {
            const logSpy = vi.spyOn(transport1, "log");

            proxyLogResolver.info(["inside"], {
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

            proxyLogResolver.error(["failed"], { error });

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
                proxyLogResolver.putMetadata({ requestId: "r1" });
                proxyLogResolver.putMetadata("userId", "u1");
                proxyLogResolver.info(["inside"]);
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
        let transientProxyLogResolver: ProxyLogResolver<Transports>;
        let transientTransport: NoOpLogTransport;
        let resolveCount: number;

        beforeEach(async () => {
            const transientExecutionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            transientTransport = new NoOpLogTransport();
            const container = new Container({
                executionContext: transientExecutionContext,
            });
            resolveCount = 0;
            const factory = () => {
                resolveCount++;
                const resolver = new LogResolver<Transports>({
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
                token: LogResolver,
                factory,
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            transientProxyLogResolver = new ProxyLogResolver<Transports>({
                container,
                resolverToken: LogResolver,
            });

            await container.init();
        });

        test("Should resolve the resolver on every operation:", () => {
            transientProxyLogResolver.info(["first"]);
            transientProxyLogResolver.info(["second"]);

            expect(resolveCount).toBe(2);
        });

        test("Should not share the run scope between operations:", () => {
            const logSpy = vi.spyOn(transientTransport, "log");

            transientProxyLogResolver.run(
                () => {
                    transientProxyLogResolver.info(["inside"]);
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
            const scopedTransport = new NoOpLogTransport();
            const container = new Container({
                executionContext: scopedExecutionContext,
            });
            container.registerFactory({
                token: LogResolver,
                factory: () => {
                    const resolver = new LogResolver<Transports>({
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
            const scopedProxyLogResolver = new ProxyLogResolver<Transports>({
                container,
                resolverToken: LogResolver,
            });
            await container.init();
            const logSpy = vi.spyOn(scopedTransport, "log");

            await container.run({
                scope: () => {
                    scopedProxyLogResolver.info(["inside"]);
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
            const scopedTransport = new NoOpLogTransport();
            const container = new Container({
                executionContext: scopedExecutionContext,
            });
            container.registerFactory({
                token: LogResolver,
                factory: () => {
                    const resolver = new LogResolver<Transports>({
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
            const scopedProxyLogResolver = new ProxyLogResolver<Transports>({
                container,
                resolverToken: LogResolver,
            });
            await container.init();
            const logSpy = vi.spyOn(scopedTransport, "log");

            await container.run({
                scope: () => {
                    scopedProxyLogResolver.run(
                        () => {
                            scopedProxyLogResolver.info(["inside"]);
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
