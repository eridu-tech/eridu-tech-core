/**
 * @module SharedLock
 */

import { v4 } from "uuid";

import { callInvocable } from "@/utilities/_module-exports.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { ISharedLockFactory } from "@/shared-lock/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Constants that specify whether the middleware should acquire the shared lock
 * in **reader** mode (concurrent readers allowed) or **writer** mode
 * (exclusive access).
 *
 * @group Middlewares
 */
export const SHARED_LOCK_WHEN = {
    READER: "READER",
    WRITER: "WRITER",
} as const;

/**
 * Union type of the possible values for the `when` setting.
 *
 * @see {@link SHARED_LOCK_WHEN}
 * @group Middlewares
 */
export type SharedLockWhenSetting =
    (typeof SHARED_LOCK_WHEN)[keyof typeof SHARED_LOCK_WHEN];

/**
 * Minimal resolver contract required by {@link withSharedLockFactory}.
 *
 * A narrowed form of `ISharedLockFactoryResolver`: `use()` only has to return
 * a factory that exposes `create`.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/middlewares"`
 * @group Middlewares
 */
export type CreateSharedLockResolver<TAdapters extends string = string> = {
    /**
     * Selects the shared-lock factory used to create locks.
     *
     * @param adapterName - The adapter to use. Defaults to the resolver's
     * default adapter.
     * @returns The resolved factory, limited to `create`.
     */
    use(adapterName?: TAdapters): ISharedLockFactory;
};

/**
 * Settings for the distributed shared-lock middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/middlewares"`
 * @group Middlewares
 */
export type WithSharedLockFactorySettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     *  A function that produces the lock key from the wrapped
     * function's arguments. All consumers using the same key share the same
     * lock state.
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
     * automatically. If omitted the default TTL of the shared-lock factory is
     * used.
     */
    ttl?: ITimeSpan | null;

    /**
     * Maximum number of concurrent readers allowed when the lock is acquired
     * in reader mode.
     */
    limit: number;

    /**
     * Whether to acquire the lock in **reader** or **writer** mode.
     *
     * - `"READER"` — multiple readers can hold the lock concurrently.
     * - `"WRITER"` — exclusive access; no other reader or writer can hold
     *   the lock.
     *
     * @see {@link SHARED_LOCK_WHEN}
     */
    when: SharedLockWhenSetting;
};

/**
 * A middleware factory that wraps the wrapped function in a distributed
 * shared lock.
 *
 * Produced by {@link withSharedLockFactory}; the lock key comes from the `key`
 * setting.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/middlewares"`
 * @group Middlewares
 */
export type WithSharedLock = <TParameters extends Array<unknown>, TReturn>(
    settings: WithSharedLockFactorySettings<TParameters>,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withSharedLockFactory}.
 *
 * Calling `use()` returns a {@link WithSharedLock} bound to the selected
 * adapter.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/middlewares"`
 * @group Middlewares
 */
export type WithSharedLockResolver<TAdapters extends string = string> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     * @returns A {@link WithSharedLock} bound to the selected adapter.
     */
    use(adapter?: TAdapters): WithSharedLock;
};

/**
 * Creates a middleware factory that wraps function calls with a distributed
 * shared lock (reader-writer lock).
 *
 * When the `when` setting is `"READER"` multiple callers can execute the
 * wrapped function concurrently. When `"WRITER"` the caller gets exclusive
 * access — no other reader or writer can hold the lock at the same time.
 * Calling the returned function uses the resolver's default adapter, while
 * `use()` selects a specific one.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param sharedLockFactoryResolver - The resolver used to select the
 * shared-lock factory.
 * @returns A {@link WithSharedLock} that is also a
 *          {@link WithSharedLockResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/middlewares"`
 * @group Middlewares
 */
export function withSharedLockFactory<TAdapters extends string = string>(
    sharedLockFactoryResolver: CreateSharedLockResolver<TAdapters>,
): WithSharedLock & WithSharedLockResolver<TAdapters> {
    const withSharedLockResolver: WithSharedLockResolver<TAdapters>["use"] =
        function use(adapter?: TAdapters): WithSharedLock {
            return (settings) => {
                const { key, lockId = () => v4(), when, ...rest } = settings;
                const sharedLockFactory =
                    sharedLockFactoryResolver.use(adapter);
                return ({ next, args }) => {
                    if (when === SHARED_LOCK_WHEN.READER) {
                        return sharedLockFactory
                            .create(callInvocable(key, args), {
                                ...rest,
                                lockId: callInvocable(lockId, args),
                            })
                            .runReaderOrFail(next);
                    }
                    return sharedLockFactory
                        .create(callInvocable(key, args), {
                            ...rest,
                            lockId: callInvocable(lockId, args),
                        })
                        .runWriterOrFail(next);
                };
            };
        };

    const middleware = withSharedLockResolver() as WithSharedLock &
        WithSharedLockResolver<TAdapters>;
    middleware.use = withSharedLockResolver;
    return middleware;
}
