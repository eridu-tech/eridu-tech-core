/**
 * @module EventBus
 */

import type { IEventBusAdapter } from "@/event-bus/contracts/_module-exports.js";
import type { ILog } from "@/log/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to an event bus adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are grouped under
 * `[EventBus]` and named `addListener`, `dispatch`, or `removeListener`
 * followed by `succeeded` or `failed`. Successful entries carry the adapter
 * class name and the event name, plus the event data for `dispatch`. Listeners
 * are never logged.
 *
 * @param log - The log that receives the entries. Only `debug` and
 * `error` are used.
 * @returns A middleware plugin that wraps an `IEventBusAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/plugins"`
 * @group Plugins
 */
export function withEventBusLogging(log: ILog): PluginFn<IEventBusAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "addListener", [
            async ({ args: [eventName], next }) => {
                try {
                    await next();
                    log.debug(["addListener succeeded"], {
                        group: "[EventBus]",
                        metadata: {
                            adapter: adapterName,
                            eventName,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["addListener failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "dispatch", [
            async ({ args: [eventName, event], next }) => {
                try {
                    await next();
                    log.debug(["dispatch succeeded"], {
                        group: "[EventBus]",
                        metadata: {
                            adapter: adapterName,
                            eventName,
                            event,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["dispatch failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "removeListener", [
            async ({ args: [eventName], next }) => {
                try {
                    await next();
                    log.debug(["removeListener succeeded"], {
                        group: "[EventBus]",
                        metadata: {
                            adapter: adapterName,
                            eventName,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["removeListener failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
