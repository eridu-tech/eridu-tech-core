---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Event-bus resolver classes
tags:
    - Event-bus
    - Resolvers
keywords:
    - Event-bus
    - Resolvers
---

# EventBusResolver

The `EventBusResolver` class creates an event bus for each configured adapter. Use it to dispatch through a default adapter or select a specific adapter at runtime.

## Initial configuration

Configure the named adapters in the constructor, then call `init()` before registering listeners or selecting an event bus. Initialization creates an event bus for each configured adapter.

```ts file=./samples/event-bus-resolver-initial-config.ts

```

## Usage

### Registering listeners

Register listeners during application setup. The resolver adds each listener to every configured adapter, so it can handle events regardless of which adapter is used to dispatch them.

### 1. Using the default adapter

```ts file=./samples/event-bus-resolver-default-adapter.ts

```

:::danger
If no default adapter is configured and none is specified in `use()`, an error is thrown.
:::

### 2. Specifying an adapter explicitly

```ts file=./samples/event-bus-resolver-specific-adapter.ts

```

:::danger
If you specify an adapter that is not configured, an error is thrown. Call `init()` before `use()`; otherwise, no configured adapter is available yet.
:::

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.
