/**
 * @module RateLimiter
 */

import type { IRateLimiterFactory } from "@/rate-limiter/contracts/rate-limiter-factory.contract.js";

/**
 * Resolves a rate limiter factory by adapter name.
 *
 * Keeps the adapter choice (memory, database, Redis, ...) out of call sites so the
 * backend can vary at runtime.
 *
 * @template TAdapters - Registered adapter names
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/contracts"`
 * @group Contracts
 */
export type IRateLimiterFactoryResolver<TAdapters extends string = string> = {
    /**
     * Returns the factory registered for `adapterName`, or the default factory when omitted.
     *
     * @param adapterName - Adapter to use; defaults to the registered default
     * @returns The resolved rate limiter factory
     *
     * @throws {UnregisteredAdapterError} When `adapterName` is not registered
     * @throws {DefaultAdapterNotDefinedError} When no name is given and no default is registered
     */
    use(adapterName?: TAdapters): IRateLimiterFactory;
};
