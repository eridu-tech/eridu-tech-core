import { beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/no-op-rate-limiter-adapter/no-op-rate-limiter-adapter.js";
import { RateLimiterFactoryResolver } from "@/rate-limiter/implementations/derivables/_module-exports.js";
import { ProxyRateLimiterFactoryResolver } from "@/rate-limiter/implementations/derivables/di/proxy-rate-limiter-factory-resolver/proxy-rate-limiter-factory-resolver.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";

import type { Mock } from "vitest";

import type {
    IRateLimiter,
    IRateLimiterAdapter,
    IRateLimiterFactory,
    IRateLimiterFactoryResolver,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { IFlexibleSerde } from "@/serde/contracts/_module-exports.js";

describe("class: ProxyRateLimiterFactoryResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let rateLimiterFactory: IRateLimiterFactoryResolver<Adapters> &
        IRateLimiterFactory;
    let container: Container;
    let getState1: Mock<IRateLimiterAdapter["getState"]>;
    let getState2: Mock<IRateLimiterAdapter["getState"]>;
    let serde: IFlexibleSerde<string>;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            serde = new SuperJsonSerde();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpRateLimiterAdapter();
            getState1 = vi.spyOn(adapter1, "getState");

            const adapter2 = new NoOpRateLimiterAdapter();
            getState2 = vi.spyOn(adapter2, "getState");

            container.registerFactory({
                token: RateLimiterFactoryResolver,
                factory: () => {
                    return new RateLimiterFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        serde,
                    });
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            rateLimiterFactory = new ProxyRateLimiterFactoryResolver<Adapters>({
                container,
                resolverToken: RateLimiterFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await rateLimiterFactory.create(key, { limit: 2 }).getState();

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await rateLimiterFactory
                .use("adapter1")
                .create(key, { limit: 2 })
                .getState();

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await rateLimiterFactory
                .use("adapter2")
                .create(key, { limit: 2 })
                .getState();

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState1).not.toHaveBeenCalled();
        });

        describe("Serde tests:", () => {
            test("Should serialize and deserialize a rate limiter created with the default adapter", async () => {
                const key = "a";
                const rateLimiter = rateLimiterFactory.create(key, {
                    limit: 2,
                });

                const deserializedRateLimiter =
                    await serde.deserialize<IRateLimiter>(
                        await serde.serialize(rateLimiter),
                    );

                await deserializedRateLimiter.getState();

                const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

                expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState2).not.toHaveBeenCalled();
            });
            test("Should serialize and deserialize a rate limiter created with a specific adapter", async () => {
                const key = "a";
                const rateLimiter = rateLimiterFactory
                    .use("adapter2")
                    .create(key, { limit: 2 });

                const deserializedRateLimiter =
                    await serde.deserialize<IRateLimiter>(
                        await serde.serialize(rateLimiter),
                    );

                await deserializedRateLimiter.getState();

                const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

                expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState1).not.toHaveBeenCalled();
            });
        });
    });
    describe("LIFETIME.TRANSIENT:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            serde = new SuperJsonSerde();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpRateLimiterAdapter();
            getState1 = vi.spyOn(adapter1, "getState");

            const adapter2 = new NoOpRateLimiterAdapter();
            getState2 = vi.spyOn(adapter2, "getState");

            container.registerFactory({
                token: RateLimiterFactoryResolver,
                factory: () => {
                    return new RateLimiterFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        serde,
                    });
                },
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            rateLimiterFactory = new ProxyRateLimiterFactoryResolver<Adapters>({
                container,
                resolverToken: RateLimiterFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await rateLimiterFactory.create(key, { limit: 2 }).getState();

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await rateLimiterFactory
                .use("adapter1")
                .create(key, { limit: 2 })
                .getState();

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await rateLimiterFactory
                .use("adapter2")
                .create(key, { limit: 2 })
                .getState();

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState1).not.toHaveBeenCalled();
        });

        describe("Serde tests:", () => {
            test("Should serialize and deserialize a rate limiter created with the default adapter", async () => {
                const key = "a";
                const rateLimiter = rateLimiterFactory.create(key, {
                    limit: 2,
                });

                const deserializedRateLimiter =
                    await serde.deserialize<IRateLimiter>(
                        await serde.serialize(rateLimiter),
                    );

                await deserializedRateLimiter.getState();

                const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

                expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState2).not.toHaveBeenCalled();
            });
            test("Should serialize and deserialize a rate limiter created with a specific adapter", async () => {
                const key = "a";
                const rateLimiter = rateLimiterFactory
                    .use("adapter2")
                    .create(key, { limit: 2 });

                const deserializedRateLimiter =
                    await serde.deserialize<IRateLimiter>(
                        await serde.serialize(rateLimiter),
                    );

                await deserializedRateLimiter.getState();

                const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

                expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState1).not.toHaveBeenCalled();
            });
        });
    });
    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            serde = new SuperJsonSerde();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpRateLimiterAdapter();
            getState1 = vi.spyOn(adapter1, "getState");

            const adapter2 = new NoOpRateLimiterAdapter();
            getState2 = vi.spyOn(adapter2, "getState");

            container.registerFactory({
                token: RateLimiterFactoryResolver,
                factory: () => {
                    return new RateLimiterFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        serde,
                    });
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            rateLimiterFactory = new ProxyRateLimiterFactoryResolver<Adapters>({
                container,
                resolverToken: RateLimiterFactoryResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await rateLimiterFactory
                        .create(key, { limit: 2 })
                        .getState();
                },
            });

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await rateLimiterFactory
                        .use("adapter1")
                        .create(key, { limit: 2 })
                        .getState();
                },
            });

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await rateLimiterFactory
                        .use("adapter2")
                        .create(key, { limit: 2 })
                        .getState();
                },
            });

            const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

            expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState1).not.toHaveBeenCalled();
        });

        describe("Serde tests:", () => {
            test("Should serialize and deserialize a rate limiter created with the default adapter", async () => {
                const key = "a";
                const rateLimiter = rateLimiterFactory.create(key, {
                    limit: 2,
                });

                const deserializedRateLimiter =
                    await serde.deserialize<IRateLimiter>(
                        await serde.serialize(rateLimiter),
                    );

                await deserializedRateLimiter.getState();

                const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

                expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState2).not.toHaveBeenCalled();
            });
            test("Should serialize and deserialize a rate limiter created with a specific adapter", async () => {
                const key = "a";
                const rateLimiter = rateLimiterFactory
                    .use("adapter2")
                    .create(key, { limit: 2 });

                const deserializedRateLimiter =
                    await serde.deserialize<IRateLimiter>(
                        await serde.serialize(rateLimiter),
                    );

                await deserializedRateLimiter.getState();

                const args: Parameters<IRateLimiterAdapter["getState"]> = [key];

                expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState1).not.toHaveBeenCalled();
            });
        });
    });
});
