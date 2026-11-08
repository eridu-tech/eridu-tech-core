/**
 * @module Observability
 */

import { resolveOneOrMore } from "@/utilities/_module-exports.js";

import type {
    ILoggerTransport,
    LogData,
} from "@/logger/contracts/_module-exports.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ComposableLoggerTransport implements ILoggerTransport {
    private readonly transports: Array<ILoggerTransport>;

    constructor(transports: OneOrMore<ILoggerTransport>) {
        this.transports = resolveOneOrMore(transports);
    }

    log(data: LogData): void {
        for (const transport of this.transports) {
            transport.log(data);
        }
    }
}
