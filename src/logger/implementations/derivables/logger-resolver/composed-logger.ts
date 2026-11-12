/**
 * @module Logger
 */

import { UnableToLogError } from "@/logger/contracts/_module-exports.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    FailureLogExtraInfo,
    ILogger,
    LogExtraInfo,
    LogMetadata,
    RunLogSettings,
} from "@/logger/contracts/_module-exports.js";
import type { InvocableFn, Lazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ComposedLogger implements ILogger {
    constructor(
        private readonly loggers: Array<ILogger>,
        private readonly throwWhenAllFail: boolean,
    ) {}

    private forEachLogger(fn: InvocableFn<[logger: ILogger], void>): void {
        const errors: Array<unknown> = [];

        for (const logger of this.loggers) {
            try {
                fn(logger);
            } catch (error: unknown) {
                errors.push(error);
            }
        }

        const errorCauses = errors.map((error) => {
            if (error instanceof UnableToLogError) {
                return error.cause;
            }
            return error;
        });

        const atLeastOneFailed = errorCauses.length > 0;
        if (!this.throwWhenAllFail && atLeastOneFailed) {
            throw UnableToLogError.create(new AggregateError(errorCauses));
        }

        const allFailed = errorCauses.length === this.loggers.length;
        if (this.throwWhenAllFail && allFailed) {
            throw UnableToLogError.create(new AggregateError(errorCauses));
        }
    }

    debug(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.forEachLogger((logger) => {
            logger.debug(messages, extraInfo);
        });
    }

    verbose(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.forEachLogger((logger) => {
            logger.verbose(messages, extraInfo);
        });
    }

    info(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.forEachLogger((logger) => {
            logger.info(messages, extraInfo);
        });
    }

    warn(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.forEachLogger((logger) => {
            logger.warn(messages, extraInfo);
        });
    }

    error(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.forEachLogger((logger) => {
            logger.error(messages, extraInfo);
        });
    }

    fatal(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.forEachLogger((logger) => {
            logger.fatal(messages, extraInfo);
        });
    }

    run<TValue = void>(
        invocable: Lazy<TValue>,
        settings?: RunLogSettings,
    ): TValue {
        for (const logger of this.loggers) {
            const tempInvocable = invocable;
            invocable = () => logger.run(tempInvocable, settings);
        }
        return callInvocable(invocable);
    }

    putMetadata(values: Partial<Record<string, unknown>>): void;
    putMetadata(key: string, value: unknown): void;
    putMetadata(keyOrValues: string | LogMetadata, value?: unknown): void {
        if (typeof keyOrValues === "string") {
            for (const logger of this.loggers) {
                logger.putMetadata(keyOrValues, value);
            }
            return;
        }

        for (const logger of this.loggers) {
            logger.putMetadata(keyOrValues);
        }
    }
}
