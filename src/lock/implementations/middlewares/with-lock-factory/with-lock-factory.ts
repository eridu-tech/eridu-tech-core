/**
 * @module Lock
 */

import { v4 } from "uuid";

import { callInvocable } from "@/utilities/_module-exports.js";

import type { ILockFactory } from "@/lock/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Minimal resolver contract required by {@link withLockFactory}.
 *
 * A narrowed form of `ILockFactoryResolver`: `use()` only has to return a
 * factory that exposes `create`.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/lock/middlewares"`
 * @group Middlewares
 */
export type CreateLockResolver<TAdapters extends string = string> = {
    /**
     * Selects the lock factory used to create locks.
     *
     * @param adapterName - The adapter to use. Defaults to the resolver's
     * default adapter.
     * @returns The resolved factory, limited to `create`.
     */
    use(adapterName?: TAdapters): ILockFactory;
};

/**
 * Settings for the distributed-lock middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/lock/middlewares"`
 * @group Middlewares
 */
export type WithLockSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     *  A function that produces the lock key from the wrapped
     * function's arguments. The lock is acquired on this key, ensuring mutual
     * exclusion across processes for the same key.
     */
    key: Invocable<[args: TParameters], string>;

    /**
     *  A function that produces a unique identifier for the
     * current lock acquisition attempt. The lock ID distinguishes competing
     * consumers trying to acquire the same lock.
     *
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     * ```
     */
    lockId?: Invocable<[args: TParameters], string>;

    /**
     * Time-to-live for the lock. If `null` the lock never expires
     * automatically. If omitted the default TTL of the lock factory is used.
     */
    ttl?: ITimeSpan | null;
};

/**
 * A middleware factory that wraps the wrapped function in a distributed lock.
 *
 * Produced by {@link withLockFactory}; the lock key comes from the `key`
 * setting.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/lock/middlewares"`
 * @group Middlewares
 */
export type WithLock = <TParameters extends Array<unknown>, TReturn>(
    settings: WithLockSettings<TParameters>,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withLockFactory}.
 *
 * Calling `use()` returns a {@link WithLock} bound to the selected adapter.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/lock/middlewares"`
 * @group Middlewares
 */
export type WithLockResolver<TAdapters extends string = string> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     * @returns A {@link WithLock} bound to the selected adapter.
     */
    use(adapter?: TAdapters): WithLock;
};

/**
 * Creates a middleware factory that wraps function calls with a distributed
 * lock.
 *
 * Before executing the wrapped function a lock is acquired on the derived key.
 * If another process already holds the lock the call waits (or fails
 * immediately for non-blocking locks) until the lock is released. Calling the
 * returned function uses the resolver's default adapter, while `use()` selects
 * a specific one.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param lockFactoryResolver - The resolver used to select the lock factory.
 * @returns A {@link WithLock} that is also a {@link WithLockResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/lock/middlewares"`
 * @group Middlewares
 */
export function withLockFactory<TAdapters extends string = string>(
    lockFactoryResolver: CreateLockResolver<TAdapters>,
): WithLock & WithLockResolver<TAdapters> {
    const withLockResolver: WithLockResolver<TAdapters>["use"] = function use(
        adapter?: TAdapters,
    ): WithLock {
        return (settings) => {
            const { key, lockId = () => v4(), ...rest } = settings;
            return ({ next, args }) => {
                return lockFactoryResolver
                    .use(adapter)
                    .create(callInvocable(key, args), {
                        ...rest,
                        lockId: callInvocable(lockId, args),
                    })
                    .runOrFail(next);
            };
        };
    };

    const middleware = withLockResolver() as WithLock &
        WithLockResolver<TAdapters>;
    middleware.use = withLockResolver;
    return middleware;
}
