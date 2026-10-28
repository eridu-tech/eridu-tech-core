/**
 * @module GenericPool
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { UnableToAcquireError } from "@/generic-pool/contracts/generic-pool.errors.js";
import type { Invocable, Promisable } from "@/utilities/_module-exports.js";

/**
 * Defines operations for creating, destroying, and validating resources.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool/contracts"`
 * @group Contracts
 */
export type IResourceFactory<TClient> = {
    /**
     * Creates a resource.
     */
    create(): Promisable<TClient>;

    /**
     * Destroys a resource.
     */
    destroy(resource: TClient): Promisable<void>;

    /**
     * Determines whether a resource is valid.
     */
    validate?(resource: TClient): Promisable<boolean>;
};

/**
 * Defines how callers borrow a client from the pool.
 *
 * `IGenericPool` extends it with pool shutdown.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool/contracts"`
 * @group Contracts
 */
export type IGenericPoolBase<TClient = unknown> = {
    /**
     * Invokes a callback with a client from the pool and returns its result.
     *
     * @template TReturn - The value returned by `invocable`.
     * @param invocable - Callback that receives the pooled client.
     * @returns The value returned by `invocable`.
     */
    run<TReturn>(
        invocable: Invocable<[client: TClient], Promisable<TReturn>>,
    ): Promise<TReturn>;

    /**
     * Gets an available client from the pool.
     *
     * Waits when the pool is at capacity, and resolves as soon as a client is available.
     * Always return the client with `release` when you're done.
     *
     * @returns The acquired client.
     *
     * @throws {UnableToAcquireError}
     */
    acquireOrFail(): Promise<TClient>;

    /**
     * Returns a client to the pool so it can be used again.
     *
     * Call it exactly once per `acquireOrFail`, ideally in a `finally` block.
     *
     * @param client - The client returned by `acquireOrFail`.
     * @returns Resolves once the client is back in the pool.
     */
    release(client: TClient): Promise<void>;
};

/**
 * Defines how callers borrow a client and how the pool is shut down.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool/contracts"`
 * @group Contracts
 */
export type IGenericPool<TClient = unknown> = IGenericPoolBase<TClient> & {
    /**
     * Closes the pool.
     */
    close(): Promise<void>;
};

/**
 * A client or a pool for that client.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool/contracts"`
 * @group Contracts
 */
export type Poolable<TClient = unknown> = TClient | IGenericPoolBase<TClient>;
