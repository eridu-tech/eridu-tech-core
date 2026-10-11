---
sidebar_position: 7
sidebar_label: DI integration
pagination_label: Event-bus DI container integration
tags:
    - Event-bus
    - DI
    - Dependency injection
keywords:
    - Event-bus
    - DI
    - Dependency injection
---

# DI Integration

The `ProxyEventBusResolver` class provides an [`IEventBusResolver`](../event_bus_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The proxy supports the `IEventBusResolver` operations:

- `use(adapterName?)` returns a dispatcher that resolves the resolver from the container for each dispatch. This supports the resolver's configured lifetime; use scoped registrations inside `container.run()`.
- `addListener(eventNames, listener)` registers the listener as a container initialization hook. Listeners must be registered before `container.init()`; you cannot add listeners dynamically after initialization.

Create the proxy before calling `container.init()`. The resolver is initialized by the container, and listeners registered through the proxy are added during container initialization. In a multi-server deployment, register listeners during startup on each server so each server is configured to receive events.

## Initial configuration

Register the `EventBusResolver` in the container, wrap it with `ProxyEventBusResolver`, and register listeners before initializing the container:

```ts file=./samples/event-bus-resolver-di.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/event-bus-resolver-di-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/event-bus-resolver-di-specific-adapter.ts

```

## Further information

For further information refer to [`eridu-tech/event-bus`](https://eridu-tech.github.io/eridu-tech-core/modules/EventBus.html) API docs.
