import { beforeEach, describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module-exports.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/no-op-rate-limiter-adapter/_module-exports.js";
import { RateLimiterFactoryResolver } from "@/rate-limiter/implementations/derivables/_module-exports.js";
import { RateLimiterFactory } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import { RateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { withRateLimiterFactory } from "@/rate-limiter/implementations/middlewares/with-rate-limiter-factory/with-rate-limiter-factory.js";

import type { RateLimiterFactoryCreateSettings } from "@/rate-limiter/contracts/_module-exports.js";

describe("function: withRateLimiterFactory", () => {
    const rateLimiterFactoryResolver = new RateLimiterFactoryResolver<"memory">(
        {
            adapters: { memory: new NoOpRateLimiterAdapter() },
            defaultAdapter: "memory",
        },
    );

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call RateLimiterFactory.create method", async () => {
        const spy = vi.spyOn(RateLimiterFactory.prototype, "create");

        const withRateLimiter = withRateLimiterFactory(
            rateLimiterFactoryResolver,
        );

        async function fn(_value: string): Promise<void> {}
        const key = "key";
        const limit = 4;
        const settings: RateLimiterFactoryCreateSettings = {
            errorPolicy: Error,
            limit,
            onlyError: true,
        };
        await use(
            fn,
            withRateLimiter({
                ...settings,
                key: ([value]) => value,
            }),
        )(key);

        expect(spy).toHaveBeenCalledExactlyOnceWith(key, settings);
    });
    test("Should call RateLimiter.run method", async () => {
        const spy = vi.spyOn(RateLimiter.prototype, "runOrFail");

        const withRateLimiter = withRateLimiterFactory(
            rateLimiterFactoryResolver,
        );

        async function fn(_value: string): Promise<void> {}
        const argValue = "value";
        const limit = 4;
        await use(
            fn,
            withRateLimiter({
                key: ([value]) => value,
                limit,
            }),
        )(argValue);

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should derive the key from multiple wrapped function arguments", async () => {
        const spy = vi.spyOn(RateLimiterFactory.prototype, "create");

        const withRateLimiter = withRateLimiterFactory(
            rateLimiterFactoryResolver,
        );

        async function fn(_userId: string, _postId: string): Promise<void> {}
        await use(
            fn,
            withRateLimiter({
                key: ([userId, postId]) => `user:${userId}:post:${postId}`,
                limit: 4,
            }),
        )("u1", "p2");

        expect(spy).toHaveBeenCalledWith("user:u1:post:p2", expect.anything());
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const withRateLimiter = withRateLimiterFactory(
            rateLimiterFactoryResolver,
        );

        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            withRateLimiter({
                key: ([a, b]) => `${a}:${b}`,
                limit: 4,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should select the adapter passed to use", async () => {
        const spy = vi.spyOn(rateLimiterFactoryResolver, "use");

        const withRateLimiter = withRateLimiterFactory(
            rateLimiterFactoryResolver,
        );

        async function fn(_value: string): Promise<void> {}
        await use(
            fn,
            withRateLimiter.use("memory")({
                key: ([value]) => value,
                limit: 4,
            }),
        )("value");

        expect(spy).toHaveBeenCalledWith("memory");
    });
});
