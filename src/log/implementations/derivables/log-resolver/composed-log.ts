/**
 * @module Logger
 */

import { UnableToLogError } from "@/log/contracts/_module-exports.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    FailureLogExtraInfo,
    ILog,
    LogExtraInfo,
    LogMetadata,
    RunLogSettings,
} from "@/log/contracts/_module-exports.js";
import type { InvocableFn, Lazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ComposedLog implements ILog {
    constructor(
        private readonly logs: Array<ILog>,
        private readonly throwWhenAllFail: boolean,
    ) {}

    private forEachLog(fn: InvocableFn<[log: ILog], void>): void {
        const errors: Array<unknown> = [];

        for (const log of this.logs) {
            try {
                fn(log);
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

        const allFailed = errorCauses.length === this.logs.length;
        if (this.throwWhenAllFail && allFailed) {
            throw UnableToLogError.create(new AggregateError(errorCauses));
        }
    }

    debug(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.forEachLog((log) => {
            log.debug(messages, extraInfo);
        });
    }

    verbose(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.forEachLog((log) => {
            log.verbose(messages, extraInfo);
        });
    }

    info(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.forEachLog((log) => {
            log.info(messages, extraInfo);
        });
    }

    warn(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.forEachLog((log) => {
            log.warn(messages, extraInfo);
        });
    }

    error(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.forEachLog((log) => {
            log.error(messages, extraInfo);
        });
    }

    fatal(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.forEachLog((log) => {
            log.fatal(messages, extraInfo);
        });
    }

    run<TValue = void>(
        invocable: Lazy<TValue>,
        settings?: RunLogSettings,
    ): TValue {
        for (const log of this.logs) {
            const tempInvocable = invocable;
            invocable = () => log.run(tempInvocable, settings);
        }
        return callInvocable(invocable);
    }

    putMetadata(values: Partial<Record<string, unknown>>): void;
    putMetadata(key: string, value: unknown): void;
    putMetadata(keyOrValues: string | LogMetadata, value?: unknown): void {
        if (typeof keyOrValues === "string") {
            for (const log of this.logs) {
                log.putMetadata(keyOrValues, value);
            }
            return;
        }

        for (const log of this.logs) {
            log.putMetadata(keyOrValues);
        }
    }
}
