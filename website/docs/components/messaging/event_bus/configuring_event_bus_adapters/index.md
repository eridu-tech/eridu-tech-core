---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring event-bus adapters
tags:
    - Event-bus
    - Configuring adapters
    - In-memory
    - Mongodb
    - Postgres
    - Redis
    - NoOp
keywords:
    - Event-bus
    - Configuring adapters
    - In-memory
    - Mongodb
    - Postgres
    - Redis
    - NoOp
---

# Configuring EventBus adapters

## MemoryEventBusAdapter

To use the `MemoryEventBusAdapter` you only need to create instance of it.

```ts file=./samples/memory-event-bus-adapter.ts

```

You can also provide an `EventEmitter` that will be used for dispatching the events in memory:

```ts file=./samples/memory-event-bus-adapter-with-emitter.ts

```

Pass any [`ITransactionHooks`](https://eridu-tech.github.io/eridu-tech-core/types/TransactionContext.ITransactionHooks.html) (like a [`TransactionContext`](/docs/components/foundation/transaction_context/transaction_context_usage), [`MultiTransactionHooks`](/docs/components/foundation/transaction_context/transaction_context_usage)) as the `transactionHooks` setting to make the adapter transaction aware. Events dispatch immediately outside a transaction, and inside transaction events dispatch after commit:

```ts file=./samples/transaction-context.ts

```

```ts file=./samples/memory-event-bus-adapter-transaction-aware.ts

```

:::info
`MemoryEventBusAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

## RedisEventBusAdapter

To use the `RedisEventBusAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:
2. Provide a string serializer ([`ISerde`](/docs/components/foundation/serde)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts file=./samples/redis-event-bus-adapter.ts

```

Pass any [`ITransactionHooks`](https://eridu-tech.github.io/eridu-tech-core/types/TransactionContext.ITransactionHooks.html) (like a [`TransactionContext`](/docs/components/foundation/transaction_context/transaction_context_usage), [`MultiTransactionHooks`](/docs/components/foundation/transaction_context/transaction_context_usage)) as the `transactionHooks` setting to make the adapter transaction aware. Events dispatch immediately outside a transaction, and inside transaction events dispatch after commit:

```ts file=./samples/redis-event-bus-adapter-transaction-aware.ts

```

## MongodbEventBusAdapter

To use the `MongodbEventBusAdapter`, you'll need to:

1. Use a MongoDB replica set, change streams are not available on a standalone server.
2. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package.
3. Provide a string serializer ([`ISerde`](/docs/components/foundation/serde)). We recommend using `SuperJsonSerdeAdapter` for this purpose.

```ts file=./samples/mongodb-event-bus-adapter.ts

```

Dispatched events are inserted into the `eventBus` collection, change it with `collectionName`, and every adapter watching the same database and collection receives them. The adapter implements `IAsyncInitizable` and `IAsyncDeinitizable`: call `init()` once to create the `sendAt` TTL index, and `deInit()` to stop consuming the change stream.

The `database` setting is transaction aware: pass a `TransactionContext` to insert dispatched events inside the active transaction. The `expireAfterSeconds` setting controls how long event documents are kept before MongoDB deletes them.

## PostgresEventBusAdapter

To use the `PostgresEventBusAdapter`, you'll need to:

1. Install the required dependency: [`pg`](https://www.npmjs.com/package/pg) package.
2. Provide a string serializer ([`ISerde`](/docs/components/foundation/serde)). We recommend using `SuperJsonSerdeAdapter` for this purpose.

```ts file=./samples/postgres-event-bus-adapter.ts

```

The adapter uses a single `LISTEN`/`NOTIFY` channel instead of one channel per event name. It starts listening when the first listener is added and stops when the last one is removed, and every notification carries the event name next to the payload, so any UTF-8 event name can be used.

### Hashing the channel name

PostgreSQL identifiers are limited to 63 bytes. Pass a `hash` function to map a long channel name onto a short identifier; it defaults to the identity function:

```ts file=./samples/postgres-event-bus-adapter-hash.ts

```

## NoOpEventBusAdapter

The `NoOpEventBusAdapter` is a no-operation implementation, it performs no actions when called.

```ts file=./samples/no-op-event-bus-adapter.ts

```

:::info
The `NoOpEventBusAdapter` is useful when you want to mock out or disable your [`EventBus`](https://eridu-tech.github.io/eridu-tech-core/classes/EventBus.EventBus.html) class.
:::

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.
