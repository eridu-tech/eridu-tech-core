/**
 * @module Utilities
 */

/**
 * Asynchronous initialization contract for objects requiring async setup.
 *
 * Usage patterns:
 * - Database connection pools: open connections, verify connectivity
 * - Caches: pre-load data, verify storage backend
 * - Servers: start listening, bind to ports
 * - Factories: load configuration, prepare templates
 *
 * Call once during startup, before any other method. Implementations should be
 * idempotent and share the in-flight promise between concurrent calls.
 *
 * @see {@link IInitizable | `IInitizable`} for the synchronous variant.
 * @see {@link IAsyncDeinitizable | `IAsyncDeinitizable`} for teardown.
 *
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Contracts
 */
export type IAsyncInitizable = {
    /**
     * Initializes the object and prepares it for use.
     *
     * @returns A promise that resolves when initialization is complete
     * @throws {Error} If initialization fails (e.g., connection timeout)
     */
    init(): Promise<void>;
};

/**
 * Synchronous version of {@link IAsyncInitizable | `IAsyncInitizable`}.
 * Use only for in-memory, non-blocking initialization; anything performing I/O
 * belongs in {@link IAsyncInitizable | `IAsyncInitizable`}.
 *
 * @see {@link IDeinitizable | `IDeinitizable`} for teardown.
 *
 * IMPORT_PATH: `"eridu-tech/utilities"`
 * @group Contracts
 */
export type IInitizable = {
    /**
     * Initializes the object and prepares it for use.
     *
     * @returns Nothing; completion is signalled by the method returning
     * @throws {Error} If initialization fails (e.g., invalid configuration)
     */
    init(): void;
};
