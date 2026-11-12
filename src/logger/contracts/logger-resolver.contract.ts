/**
 * @module Logger
 */

import type { ILogger } from "@/logger/contracts/logger.contract.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * Logger resolver contract for dynamically selecting and switching between
 * logger transports.
 *
 * Typical usage:
 * - Development: Use the console transport
 * - Testing: Use the no-op transport
 * - Production: Use a transport forwarding to your logging backend
 * All without changing application code (just switch the configured transport).
 *
 * @template TTransports - Union type of registered transport names (e.g., "console" | "no-op")
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type ILoggerResolver<TTransports extends string = string> = {
    /**
     * Retrieves a logger by transport name.
     * If no transport name is provided, uses the default registered transport.
     *
     * @param transportNames - The name of the transport to retrieve (optional). If not provided, uses the default transport.
     * @returns The requested logger instance.
     *
     * @throws {UnregisteredAdapterError} If the specified transport name is not registered.
     * @throws {DefaultAdapterNotDefinedError} If no transport name is provided and no default transport is defined.
     */
    use(transportNames?: OneOrMore<TTransports>): ILogger;
};
