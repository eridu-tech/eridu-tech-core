---
sidebar_position: 6
sidebar_label: DI integration
pagination_label: Logger DI container integration
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

The `ProxyLoggerResolver` class creates an [`ILoggerResolver`](../logger_resolver/index.md) and [`ILogger`](../logger_usage/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `ILoggerResolver` and `ILogger`:

- `use(transportName?)` selects a transport alias on the resolved `LoggerResolver`.
- The `ILogger` methods such as `info`, `error`, `span` and `scopedMetadata` delegate to the logger of the default transport.

The `resolverToken` is resolved on every operation, so every `LIFETIME` is supported. Prefer `SINGLETON` or `SCOPED`: a `TRANSIENT` resolver creates new loggers per operation, so spans and metadata do not carry across operations.

## Initial configuration

#### 1. Create the dependency injection container

```ts file=./samples/container.ts

```

#### 2. Set up the logger transports

```ts file=./samples/logger-transports.ts

```

#### 3. Register and initialize the logger resolver

```ts file=./samples/proxy-logger-resolver.ts

```

## Usage

### 1. Using the default transport

```ts file=./samples/proxy-logger-resolver-default-transport.ts

```

### 2. Specifying a transport explicitly

```ts file=./samples/proxy-logger-resolver-specific-transport.ts

```

## Using it with the middlewares

Because the proxy implements `ILoggerResolver`, it can be passed straight to the [logger middleware factories](../logger_middlewares/index.md):

```ts
import { withLogSpanFactory } from "eridu-tech/logger/middlewares";
import { logger } from "./proxy-logger-resolver.js";

const withLogSpan = withLogSpanFactory(logger);
```

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Observability.html) API docs.
