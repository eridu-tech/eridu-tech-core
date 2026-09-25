import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/_module.js";
import { Cache } from "@/cache/implementations/derivables/_module.js";
import { registerWithCache } from "@/cache/implementations/middlewares/di/with-cache/with-cache.js";
import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { ICache } from "@/cache/contracts/_module.js";
import type { IContainer } from "@/di/contracts/container.contract.js";

describe("function: registerWithCache", () => {
    const CACHE = genericToken<Pick<ICache, "getOrAdd">>("ICache");

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

    test("Should resolve the cache token and call getOrAdd with the key, loader and ttl", async () => {
        const spy = vi.spyOn(cache, "getOrAdd");

        async function fn(_value: string): Promise<void> {}
        const key = "key";
        const ttl = TimeSpan.fromSeconds(20);
        await use(
            fn,
            registerWithCache(
                container,
                CACHE,
            )({
                ttl,
                key: ([value]) => value,
            }),
        )(key);

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            key,
            expect.any(Function),
            ttl,
        );
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithCache(
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
            registerWithCache(
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
            genericToken<Pick<ICache, "getOrAdd">>("IUnregisteredCache");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithCache(
                container,
                unregisteredToken,
            )({
                key: ([value]) => value,
            }),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
