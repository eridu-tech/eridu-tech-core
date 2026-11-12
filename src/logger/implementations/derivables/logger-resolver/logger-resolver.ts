/**
 * @module Logger
 */

import { Logger } from "@/logger/implementations/derivables/logger/_module.js";
import { ComposedLogger } from "@/logger/implementations/derivables/logger-resolver/composed-logger.js";
import {
    DefaultAdapterNotDefinedError,
    resolveOneOrMore,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    ILogger,
    ILoggerResolver,
    ILoggerTransport,
} from "@/logger/contracts/_module-exports.js";
import type { LoggerSettingsBase } from "@/logger/implementations/derivables/logger/_module.js";
import type { IInitizable, OneOrMore } from "@/utilities/_module-exports.js";

/**
 * Named registry of logger transports. Each key is a transport alias and the
 * corresponding value is one transport or an iterable of transports that are
 * merged for that alias.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Derivables
 */
export type LoggerTransports<TTransports extends string = string> = Partial<
    Record<TTransports, ILoggerTransport>
>;

/**
 * Configuration for `LoggerResolver`.
 * Registers named logger transports and designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Derivables
 */
export type LoggerResolverSettings<TTransports extends string = string> =
    LoggerSettingsBase & {
        /**
         * Named registry of logger transports.
         */
        transports: LoggerTransports<TTransports>;

        /**
         * The alias to use when none is explicitly specified. Must be a key in
         * the `transports` map.
         */
        defaultTransport?: NoInfer<OneOrMore<TTransports>>;

        /**
         * @default true
         */
        throwWhenAllFail?: boolean;
    };

/**
 * Creates a logger for each registered transport alias.
 * Call `init()` before selecting a logger.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Derivables
 */
export class LoggerResolver<TTransports extends string = string>
    implements ILoggerResolver<TTransports>, IInitizable
{
    private readonly factories = {} as Partial<Record<TTransports, Logger>>;

    constructor(
        private readonly settings: LoggerResolverSettings<TTransports>,
    ) {}

    init(): void {
        const { transports, ...rest } = this.settings;
        for (const transportName in transports) {
            const transport = this.settings.transports[transportName];
            if (transport === undefined) {
                continue;
            }
            const factory = new Logger({
                ...rest,
                transport,
            });
            this.factories[transportName] = factory;
        }
    }

    use(
        transportNames: OneOrMore<TTransports> | undefined = this.settings
            .defaultTransport,
    ): ILogger {
        if (transportNames === undefined) {
            throw DefaultAdapterNotDefinedError.create(
                Logger.name,
                Object.keys(this.settings.transports),
            );
        }
        const resolvedTransportNames = resolveOneOrMore(transportNames);

        const loggers = resolvedTransportNames.map<ILogger>((transportName) => {
            const logger = this.factories[transportName];
            if (logger === undefined) {
                throw UnregisteredAdapterError.create(
                    transportName,
                    Object.keys(this.settings.transports),
                );
            }
            return logger;
        });
        const composedLogger = new ComposedLogger(
            loggers,
            this.settings.throwWhenAllFail ?? true,
        );

        return composedLogger;
    }
}
