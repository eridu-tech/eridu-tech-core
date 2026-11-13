/**
 * @module Logger
 */

import { Log } from "@/log/implementations/derivables/log/_module.js";
import { ComposedLog } from "@/log/implementations/derivables/log-resolver/composed-log.js";
import {
    DefaultAdapterNotDefinedError,
    resolveOneOrMore,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    ILog,
    ILogResolver,
    ILogTransport,
} from "@/log/contracts/_module-exports.js";
import type { LogSettingsBase } from "@/log/implementations/derivables/log/_module.js";
import type { IInitizable, OneOrMore } from "@/utilities/_module-exports.js";

/**
 * Named registry of log transports. Each key is a transport alias and the
 * corresponding value is one transport or an iterable of transports that are
 * merged for that alias.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Derivables
 */
export type LogTransports<TTransports extends string = string> = Partial<
    Record<TTransports, ILogTransport>
>;

/**
 * Configuration for `LogResolver`.
 * Registers named log transports and designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Derivables
 */
export type LogResolverSettings<TTransports extends string = string> =
    LogSettingsBase & {
        /**
         * Named registry of log transports.
         */
        transports: LogTransports<TTransports>;

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
 * Creates a log for each registered transport alias.
 * Call `init()` before selecting a log.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Derivables
 */
export class LogResolver<TTransports extends string = string>
    implements ILogResolver<TTransports>, IInitizable
{
    private readonly factories = {} as Partial<Record<TTransports, Log>>;

    constructor(private readonly settings: LogResolverSettings<TTransports>) {}

    init(): void {
        const { transports, ...rest } = this.settings;
        for (const transportName in transports) {
            const transport = this.settings.transports[transportName];
            if (transport === undefined) {
                continue;
            }
            const factory = new Log({
                ...rest,
                transport,
            });
            this.factories[transportName] = factory;
        }
    }

    use(
        transportNames: OneOrMore<TTransports> | undefined = this.settings
            .defaultTransport,
    ): ILog {
        if (transportNames === undefined) {
            throw DefaultAdapterNotDefinedError.create(
                Log.name,
                Object.keys(this.settings.transports),
            );
        }
        const resolvedTransportNames = resolveOneOrMore(transportNames);

        const logs = resolvedTransportNames.map<ILog>((transportName) => {
            const log = this.factories[transportName];
            if (log === undefined) {
                throw UnregisteredAdapterError.create(
                    transportName,
                    Object.keys(this.settings.transports),
                );
            }
            return log;
        });
        const composedLog = new ComposedLog(
            logs,
            this.settings.throwWhenAllFail ?? true,
        );

        return composedLog;
    }
}
