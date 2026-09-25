import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/_module.js";
import { RateLimiterFactory } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import { RateLimiter } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import { registerWithRateLimiter } from "@/rate-limiter/implementations/middlewares/di/with-rate-limiter/with-rate-limiter.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type {
    IRateLimiterFactory,
    RateLimiterFactoryCreateSettings,
} from "@/rate-limiter/contracts/_module.js";

describe("function: registerWithRateLimiter", () => {
    const RATE_LIMITER_FACTORY = genericToken<IRateLimiterFactory>(
        "IRateLimiterFactory",
    );

    let container: IContainer;
    let rateLimiterFactory: RateLimiterFactory;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        rateLimiterFactory = new RateLimiterFactory({
            adapter: new NoOpRateLimiterAdapter(),
        });
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
        container.registerValue({
            token: RATE_LIMITER_FACTORY,
            value: rateLimiterFactory,
        });
        await container.init();
    });

    test("Should resolve the rate-limiter factory token and call create with the key and settings", async () => {
        const spy = vi.spyOn(rateLimiterFactory, "create");

        async function fn(_value: string): Promise<void> {}
        const key = "key";
        const settings: RateLimiterFactoryCreateSettings = {
            errorPolicy: Error,
            limit: 4,
            onlyError: true,
        };
        await use(
            fn,
            registerWithRateLimiter(
                container,
                RATE_LIMITER_FACTORY,
            )({
                ...settings,
                key: ([value]) => value,
            }),
        )(key);

        expect(spy).toHaveBeenCalledExactlyOnceWith(key, settings);
    });
    test("Should call RateLimiter.runOrFail method", async () => {
        const spy = vi.spyOn(RateLimiter.prototype, "runOrFail");

        async function fn(_value: string): Promise<void> {}
        await use(
            fn,
            registerWithRateLimiter(
                container,
                RATE_LIMITER_FACTORY,
            )({
                key: ([value]) => value,
                limit: 4,
            }),
        )("value");

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithRateLimiter(
                container,
                RATE_LIMITER_FACTORY,
            )({
                key: ([value]) => value,
                limit: 4,
            }),
        );

        await wrapped("a");
        await wrapped("b");

        expect(spy).toHaveBeenCalledTimes(2);
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            registerWithRateLimiter(
                container,
                RATE_LIMITER_FACTORY,
            )({
                key: ([a, b]) => `${a}:${b}`,
                limit: 4,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<IRateLimiterFactory>(
            "IUnregisteredRateLimiterFactory",
        );

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithRateLimiter(
                container,
                unregisteredToken,
            )({
                key: ([value]) => value,
                limit: 4,
            }),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
