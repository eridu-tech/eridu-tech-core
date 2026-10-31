/**
 * @module EventBus
 */

import {
    UnableToAddListenerEventBusError,
    UnableToDispatchEventBusError,
    UnableToRemoveListenerEventBusError,
} from "@/event-bus/contracts/_module-exports.js";

import type { IEventBusAdapter } from "@/event-bus/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that converts unexpected errors thrown by an event bus adapter into `UnableTo*EventBusError` errors.
 *
 * Every method of the wrapped `IEventBusAdapter` is wrapped in a `try`/`catch` block,
 * and the original error is preserved as the `cause` of the matching error:
 * - `dispatch` throws {@link UnableToDispatchEventBusError | `UnableToDispatchEventBusError`}
 * - `addListener` throws {@link UnableToAddListenerEventBusError | `UnableToAddListenerEventBusError`}
 * - `removeListener` throws {@link UnableToRemoveListenerEventBusError | `UnableToRemoveListenerEventBusError`}
 *
 * @returns A middleware plugin that wraps an `IEventBusAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 * @internal
 */
export function handleUnexpectedEventBusAdapterError(): PluginFn<IEventBusAdapter> {
    return (adapter, enhance) => {
        enhance(adapter, "dispatch", async ({ args: [eventName], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToDispatchEventBusError.create(eventName, cause);
            }
        });
        enhance(adapter, "addListener", async ({ args: [eventName], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToAddListenerEventBusError.create(eventName, cause);
            }
        });
        enhance(
            adapter,
            "removeListener",
            async ({ args: [eventName], next }) => {
                try {
                    await next();
                    return;
                } catch (cause) {
                    throw UnableToRemoveListenerEventBusError.create(
                        eventName,
                        cause,
                    );
                }
            },
        );
    };
}
