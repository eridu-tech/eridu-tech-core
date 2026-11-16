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
 * Settings for `IGenericPoolBase.runStream`.
 *
 * IMPORT_PATH: `"eridu-tech/generic-pool/contracts"`
 * @group Contracts
 */
export type RunStreamSettings<TValue, TClient = unknown> = {
    /**
     * The stream to bind to a client.
     */
    stream: AsyncIterable<TValue>;

    /**
     * An already acquired client to bind to the stream.
     *
     * When omitted, the pool acquires a client and releases it when the stream ends.
     */
    client?: TClient;
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
     * Binds a stream to a pooled client and releases that client once iteration
     * ends, including when the consumer stops early or the stream throws.
     *
     * @param settings - The stream to bind plus optional settings, see `RunStreamSettings`.
     * @returns The stream, which releases its client back to the pool when it ends.
     */
    runStream<TValue>(
        settings: RunStreamSettings<TValue, TClient>,
    ): Promise<AsyncIterable<TValue>>;

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
