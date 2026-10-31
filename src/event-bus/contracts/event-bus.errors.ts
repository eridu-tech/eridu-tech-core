/**
 * @module EventBus
 */

import type { InferInstance } from "@/utilities/_module-exports.js";

/**
 * The error is thrown when the underlying event bus adapter fails with an unexpected error while dispatching an event.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Errors
 */
export class UnableToDispatchEventBusError extends Error {
    static create(
        eventName: string,
        cause?: unknown,
    ): UnableToDispatchEventBusError {
        return new UnableToDispatchEventBusError(
            `Unable to dispatch event "${eventName}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToDispatchEventBusError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToDispatchEventBusError.name;
    }
}

/**
 * The error is thrown when the underlying event bus adapter fails with an unexpected error while adding a listener.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Errors
 */
export class UnableToAddListenerEventBusError extends Error {
    static create(
        eventName: string,
        cause?: unknown,
    ): UnableToAddListenerEventBusError {
        return new UnableToAddListenerEventBusError(
            `Unable to add listener for event "${eventName}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToAddListenerEventBusError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToAddListenerEventBusError.name;
    }
}

/**
 * The error is thrown when the underlying event bus adapter fails with an unexpected error while removing a listener.
 * The original adapter error is preserved in the `cause` property.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Errors
 */
export class UnableToRemoveListenerEventBusError extends Error {
    static create(
        eventName: string,
        cause?: unknown,
    ): UnableToRemoveListenerEventBusError {
        return new UnableToRemoveListenerEventBusError(
            `Unable to remove listener for event "${eventName}"`,
            cause,
        );
    }

    /**
     * Note: Do not instantiate `UnableToRemoveListenerEventBusError` directly via the constructor. Use the static `create()` factory method instead.
     * The constructor remains public only to maintain compatibility with errorPolicy types and prevent type errors.
     * @internal
     */
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = UnableToRemoveListenerEventBusError.name;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Errors
 */
export const EVENT_BUS_ERRORS = {
    UnableToDispatch: UnableToDispatchEventBusError,
    UnableToAddListener: UnableToAddListenerEventBusError,
    UnableToRemoveListener: UnableToRemoveListenerEventBusError,
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Errors
 */
export type AllEventBusErrors = InferInstance<
    (typeof EVENT_BUS_ERRORS)[keyof typeof EVENT_BUS_ERRORS]
>;

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/contracts"`
 * @group Errors
 */
export function isEventBusError(value: unknown): value is AllEventBusErrors {
    for (const errorClass of Object.values(EVENT_BUS_ERRORS)) {
        if (value instanceof errorClass) {
            return true;
        }
    }
    return false;
}
