---
"eridu-tech": minor
---

Add the MongoDB event bus adapter.

## Features

- `MongodbEventBusAdapter` dispatches events by inserting documents into a MongoDB collection and listens to them through a change stream, so multiple processes connected to the same database and collection receive every event.
- The adapter accepts `collectionName`, `collectionSettings` and `transactionHooks` settings, and implements `deInit` for cleanup.
- The `database` setting is transaction aware, so a `TransactionContext` can be supplied to insert dispatched events within the active transaction.
- Import it from `eridu-tech/event-bus/mongodb-event-bus-adapter`.
