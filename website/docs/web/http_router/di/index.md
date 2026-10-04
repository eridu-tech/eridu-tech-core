---
sidebar_position: 4
sidebar_label: DI integration
pagination_label: HttpRouter DI container integration
tags:
    - HttpRouter
    - DI
    - Dependency injection
keywords:
    - HttpRouter
    - DI
    - Dependency injection
    - bindHttpFactory
---

# DI Integration

The `bindHttpFactory` function turns a controller method into an [`HttpHandlerFn`](https://eridu-tech.github.io/eridu-tech-core/types/HttpRouter.HttpHandlerFn.html). This lets you keep HTTP handlers on injectable controller classes and resolve them from a [DI container](../../../foundation/di/index.md) for every request, instead of wiring handler functions to service instances manually.

`bindHttpFactory(container)` returns a binder with the signature `(token, method) => HttpHandlerFn`:

- `token` — the token of the controller to resolve.
- `method` — the name of the handler method to invoke.

For each request, the binder:

1. Resolves the controller with [`container.resolveOrFail(token)`](../../../foundation/di/index.md#resolve_or_fail), so the controller follows the lifetime of its registration.
2. Invokes the bound method with the [handler arguments](../http_router_usage/index.md#handler-arguments).
3. Throws `UnexpectedError` when the resolved member is not invocable.

:::info
Declare handler methods as **arrow function properties** so `this` stays bound to the controller instance when the binder invokes them.
:::

## Initial configuration

Set up the container, the router, and the binder created with `bindHttpFactory`:

```ts file=./samples/container.ts

```

Then define the controller and register it in the container:

```ts file=./samples/users-controller.ts

```

## Usage

### Registering endpoints

Pass `bindHttp(Controller, "methodName")` wherever a handler is accepted:

```ts file=./samples/bind-http-factory-endpoint.ts

```

### Inside route groups

The bound handler is a regular handler, so it can be registered inside route groups:

```ts file=./samples/bind-http-factory-with-group.ts

```

## Further information

For further information refer to:

- [`eridu-tech/http-router`](https://eridu-tech.github.io/eridu-tech-core/modules/HttpRouter.html) API docs.
- [DI Container usage](../../../foundation/di/index.md) for the container lifecycle and registration methods.
