---
sidebar_position: 6
sidebar_label: DI integration
pagination_label: Log DI container integration
tags:
    - Logger
    - DI
    - Dependency injection
keywords:
    - Logger
    - DI
    - Dependency injection
---

# DI Integration

The `ProxyLogResolver` class creates an [`ILogResolver`](../logger_resolver/index.md) and [`ILog`](../logger_usage/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `ILogResolver` and `ILog`:

- `use(transportName?)` selects a transport alias on the resolved `LogResolver`.
- The `ILog` methods such as `info`, `error`, `run` and `putMetadata` delegate to the log of the default transport.

The `resolverToken` is resolved on every operation, so every `LIFETIME` is supported. Prefer `SINGLETON` or `SCOPED`: a `TRANSIENT` resolver creates new logs per operation, so `run` scopes do not carry across operations.

## Initial configuration

#### 1. Create the dependency injection container

```ts file=./samples/container.ts

```

#### 2. Set up the log transports

```ts file=./samples/log-transports.ts

```

#### 3. Register and initialize the log resolver

Create the resolver, call its `init()`, and register it on the container before the proxy is used:

```ts file=./samples/proxy-log-resolver.ts

```

## Usage

### 1. Using the default transport

```ts file=./samples/proxy-log-resolver-default-transport.ts

```

### 2. Specifying a transport explicitly

```ts file=./samples/proxy-log-resolver-specific-transport.ts

```

## Using it with the middlewares

Because the proxy implements `ILogResolver`, it can be passed straight to the [log middleware factories](../logger_middlewares/index.md):

```ts
import { withLogSpanFactory } from "eridu-tech/log/middlewares";
import { log } from "./proxy-log-resolver.js";

const withLogSpan = withLogSpanFactory(log);
```

## Further information

For further information refer to [`eridu-tech/log`](https://eridu-tech.github.io/eridu-tech-core/modules/Logger.html) API docs.
