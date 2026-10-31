---
"eridu-tech": minor
---

New `UnableTo` errors that describe an event bus adapter failure, available from `eridu-tech/event-bus/contracts`:

- `UnableToDispatchEventBusError`
- `UnableToAddListenerEventBusError`
- `UnableToRemoveListenerEventBusError`

They are registered in `EVENT_BUS_ERRORS`, so `isEventBusError()` and `AllEventBusErrors` include them. Each error wraps the unexpected adapter error as its `cause`, and the `IEventListenable` and `IEventDispatcher` methods now document the `UnableTo` error they can throw when the underlying adapter fails.

The new `handleUnexpectedEventBusAdapterError` plugin applies that mapping to every adapter method. `EventBus` wraps the provided adapter with it internally, so `try`/`catch` covers `dispatch`, `addListener` and `removeListener` and rethrows the matching error with the original error as its cause, including through schema plugins and `withListenerTracking`.
