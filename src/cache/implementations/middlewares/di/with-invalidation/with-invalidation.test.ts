import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { Cache } from "@/cache/implementations/derivables/_module.js";
import { registerWithInvalidation } from "@/cache/implementations/middlewares/di/with-invalidation/with-invalidation.js";
import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";

import type { ICache } from "@/cache/contracts/_module.js";
import type { IContainer } from "@/di/contracts/container.contract.js";

describe("function: registerWithInvalidation", () => {
    const CACHE = genericToken<Pick<ICache, "remove">>("ICache");

    let container: IContainer;
    let cache: Cache<string>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        cache = new Cache<string>({ adapter: new NoOpCacheAdapter() });
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
        container.registerValue({ token: CACHE, value: cache });
        await container.init();
    });

    test("Should resolve the cache token and remove the key derived from the arguments", async () => {
        const spy = vi.spyOn(cache, "remove");

        const innerFn = vi.fn((id: string): Promise<string> =>
            Promise.resolve(`value-${id}`),
        );
        const wrapped = use(
            innerFn,
            registerWithInvalidation(
                container,
                CACHE,
            )({
                key: ([id]) => `cache:${id}`,
            }),
        );

        const result = await wrapped("42");

        expect(result).toBe("value-42");
        expect(spy).toHaveBeenCalledExactlyOnceWith("cache:42");
        expect(innerFn).toHaveBeenCalledExactlyOnceWith("42");
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithInvalidation(
                container,
                CACHE,
            )({
                key: ([value]) => value,
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
            registerWithInvalidation(
                container,
                CACHE,
            )({
                key: ([a, b]) => `${a}:${b}`,
            }),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken =
            genericToken<Pick<ICache, "remove">>("IUnregisteredCache");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithInvalidation(
                container,
                unregisteredToken,
            )({
                key: ([value]) => value,
            }),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
