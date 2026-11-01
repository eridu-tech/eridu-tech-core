---
"eridu-tech": minor
---

Error instances in `eridu-tech/event-bus/contracts` now expose the `eventName` they were created for:

- `UnableToDispatchEventBusError.eventName`
- `UnableToAddListenerEventBusError.eventName`
- `UnableToRemoveListenerEventBusError.eventName`

Each `create()` factory passes the event name to the error, so it is available as a `readonly` field alongside the existing `message` and `cause`.
