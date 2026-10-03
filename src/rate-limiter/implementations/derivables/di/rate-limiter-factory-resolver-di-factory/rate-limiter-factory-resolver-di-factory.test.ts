import { beforeEach, describe, expect, test, vi } from "vitest";

import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/no-op-rate-limiter-adapter/no-op-rate-limiter-adapter.js";
import { RateLimiterFactoryResolver } from "@/rate-limiter/implementations/derivables/_module-exports.js";
import { rateLimiterFactoryResolverDiFactory } from "@/rate-limiter/implementations/derivables/di/rate-limiter-factory-resolver-di-factory/rate-limiter-factory-resolver-di-factory.js";

import type { Mock } from "vitest";

import type {
    IRateLimiterAdapter,
    IRateLimiterFactory,
    IRateLimiterFactoryResolver,
} from "@/rate-limiter/contracts/_module-exports.js";

describe("function: rateLimiterFactoryResolverDiFactory", () => {
    type Adapters = "adapter1" | "adapter2";
    let rateLimiterFactory: IRateLimiterFactoryResolver<Adapters> &
        IRateLimiterFactory;
    let getState1: Mock<IRateLimiterAdapter["getState"]>;
    let getState2: Mock<IRateLimiterAdapter["getState"]>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const container = new Container({
            executionContext,
        });

        const adapter1 = new NoOpRateLimiterAdapter();
        getState1 = vi.spyOn(adapter1, "getState");

        const adapter2 = new NoOpRateLimiterAdapter();
        getState2 = vi.spyOn(adapter2, "getState");

        const rateLimiterFactoryResolver =
            new RateLimiterFactoryResolver<Adapters>({
                adapters: {
                    adapter1,
                    adapter2,
                },
                defaultAdapter: "adapter1",
            });
        container.registerValue({
            token: RateLimiterFactoryResolver,
            value: rateLimiterFactoryResolver,
        });
        rateLimiterFactory = rateLimiterFactoryResolverDiFactory<Adapters>(
            container,
            RateLimiterFactoryResolver,
        );

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
});
