/**
 * @module EventBus
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { IEventBusAdapter } from "@/event-bus/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type {
    MiddlewareFn,
    PluginFn,
} from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to an event bus adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `event-bus.<methodName> succeeded|failed`. On success the logged arguments and
 * the returned value are merged into the metadata as `event-bus.args` and
 * `event-bus.result`; `addListener` and `removeListener` strip the listener,
 * while `dispatch` keeps the payload. Every call runs inside the
 * `event-bus.adapter` scoped metadata, which holds the adapter class name.
 *
 * @param logger - The logger that receives the entries. Only `debug`, `error`, `scopedMetadata` and `putMetadata` are used.
 * @returns A middleware plugin that wraps an `IEventBusAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/plugins"`
 * @group Plugins
 */
export function withEventBusLogging(
    logger: Pick<ILogger, "debug" | "error" | "scopedMetadata" | "putMetadata">,
): PluginFn<IEventBusAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof IEventBusAdapter,
            args: Array<unknown>,
            invocable: () => Promise<TValue>,
        ): Promise<TValue> {
            const prefix = `event-bus.${methodName}`;
            try {
                const result = await invocable();
                logger.putMetadata({
                    "event-bus.args": args,
                    "event-bus.result": result,
                });
                logger.debug(`${prefix} succeeded`);
                return result;
            } catch (error: unknown) {
                logger.error(`${prefix} failed`);
                throw error;
            }
        }
        const withMetadata: MiddlewareFn<any, any> = ({ next }) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return logger.scopedMetadata(
                { "event-bus.adapter": getConstructorName(adapter) },
                next,
            );
        };
        enhance(adapter, "addListener", [
            withMetadata,
            ({ args: [eventName], next }) =>
                logCall("addListener", [eventName], next),
        ]);
        enhance(adapter, "dispatch", [
            withMetadata,
            ({ args, next }) => logCall("dispatch", args, next),
        ]);
        enhance(adapter, "removeListener", [
            withMetadata,
            ({ args: [eventName], next }) =>
                logCall("removeListener", [eventName], next),
        ]);
    };
}
