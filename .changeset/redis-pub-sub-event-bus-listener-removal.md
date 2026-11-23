---
"eridu-tech": patch
---

Fix `RedisPubSubEventBusAdapter` so removing one listener no longer disables the remaining listeners for the same event.

- `removeListener` previously called `unsubscribe(eventName)` on every call, which unsubscribes the whole Redis channel. When two or more listeners were registered for the same event, removing one of them silently stopped delivery to all the others, so they were never invoked again.
- `addListener` also registered a new `"message"` handler on the listener client on every call. Each additional registration made a single Redis message run the handler again, invoking every listener once per registered handler (and re-deserializing the same payload each time).
- `addListener` now subscribes only when the first listener for an event is added, and `removeListener` unsubscribes only when the last one is removed, using the local `EventEmitter`'s listener count. The `"message"` handler is registered once in the constructor.
- The event bus adapter test suite now covers this case: two listeners for the same event, one removed, and the remaining one still receives the dispatched event.
