---
"eridu-tech": minor
---

Add the PostgreSQL event bus adapter at `eridu-tech/event-bus/postgres-event-bus-adapter`.

- `PostgresEventBusAdapter` uses a single `LISTEN`/`NOTIFY` channel (configurable through `channelName`, default `eridu_tech_event_bus`) instead of one channel per event name. The channel identifier is escaped before it is interpolated into the `LISTEN`/`UNLISTEN` statements, so names with spaces, quotes, dots or mixed case are valid.
- The adapter starts listening when the first listener is added and stops when the last one is removed. Removing one of several listeners keeps the channel subscribed for the remaining listeners.
- Every notification carries the event name next to the event payload. Payloads are serialized with the provided `serde` and published through the parameterized `pg_notify($1, $2)` call, so any UTF-8 event name — including empty or very long names — can be used without hashing or truncation.
- `PostgresEventBusAdapterSettings` takes a `pg` `Client`, a `serde`, an optional `channelName` and optional `transactionHooks` that defer dispatching until the active transaction commits.
- Requires the `pg` package to be installed alongside `eridu-tech`.
