/**
 * @module EventBus
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { IEventBusAdapter } from "@/event-bus/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to an event bus adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `<adapter class name>.<methodName> succeeded|failed` and carry the call
 * arguments as `args` together with either the returned value as `result` or
 * the thrown value as `error`. `addListener` and `removeListener` log only the
 * event name, while `dispatch` logs the event name with the payload as-is.
 *
 * @param logger - The logger that receives the entries. Only `debug` and `error` are used.
 * @returns A middleware plugin that wraps an `IEventBusAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/plugins"`
 * @group Plugins
 */
export function withEventBusLogging(
    logger: Pick<ILogger, "debug" | "error">,
): PluginFn<IEventBusAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof IEventBusAdapter,
            args: Array<unknown>,
            invocable: () => Promise<TValue>,
        ): Promise<TValue> {
            const prefix = `${getConstructorName(adapter)}.${methodName}`;
            try {
                const result = await invocable();
                logger.debug(`${prefix} succeeded`, { args, result });
                return result;
            } catch (error: unknown) {
                logger.error(`${prefix} failed`, { args, error });
                throw error;
            }
        }
        enhance(adapter, "addListener", ({ args: [eventName], next }) =>
            logCall("addListener", [eventName], next),
        );
        enhance(adapter, "dispatch", ({ args, next }) =>
            logCall("dispatch", args, next),
        );
        enhance(adapter, "removeListener", ({ args: [eventName], next }) =>
            logCall("removeListener", [eventName], next),
        );
    };
}
