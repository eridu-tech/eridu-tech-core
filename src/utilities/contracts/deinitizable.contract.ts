/**
 * @module Utilities
 */

/**
 * Asynchronous deinitialization contract for objects requiring async cleanup.
 * Counterpart to {@link IAsyncInitizable | `IAsyncInitizable`}: tear down once at
 * shutdown, in reverse order of acquisition.
 *
 * Usage patterns:
 * - Database connection pools: close connections, flush pending queries
 * - Caches: persist data, close backend connections
 * - Servers: stop listening, close client connections
 * - Event listeners: unregister, cleanup memory
 * - Locks: release held resources
 *
 * Implementations should be idempotent and safe to call without a preceding
 * `init()`. A failure should be reported without blocking other resources from
 * being released.
 *
 * @see {@link IDeinitizable | `IDeinitizable`} for the synchronous variant.
 * @see {@link IAsyncInitizable | `IAsyncInitizable`} for setup.
 *
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Contracts
 */
export type IAsyncDeinitizable = {
    /**
     * Releases held resources and finalizes state.
     *
     * @returns A promise that resolves when deinitialization is complete
     * @throws {Error} If deinitialization fails (e.g., pending writes cannot be flushed)
     */
    deInit(): Promise<void>;
};

/**
 * Synchronous version of {@link IAsyncDeinitizable | `IAsyncDeinitizable`}.
 * Use only for in-memory cleanup; anything waiting on I/O belongs in
 * {@link IAsyncDeinitizable | `IAsyncDeinitizable`}.
 *
 * @see {@link IInitizable | `IInitizable`} for setup.
 *
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Contracts
 */
export type IDeinitizable = {
    /**
     * Releases held resources and finalizes state.
     *
     * @returns Nothing; completion is signalled by the method returning
     * @throws {Error} If deinitialization fails (e.g., listener removal is rejected)
     */
    deInit(): void;
};
