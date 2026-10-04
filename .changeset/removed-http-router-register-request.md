---
"eridu-tech": minor
---

Removed the request-scoping HTTP middleware and the `REQUEST` token from the `eridu-tech/http-router/di` entrypoint.

`registerRequest(container)` declared the `REQUEST` token as a dynamic token and returned an `HttpMiddlewareFn` that ran the rest of the request inside `container.run()`, with the incoming `IHttpReq` registered under `REQUEST`. It was removed because it will be rewritten using the new DI module component. `registerRequest`, the `REQUEST` token and their tests are removed.

### Breaking changes

- `eridu-tech/http-router/di` no longer exports `registerRequest`.
- `eridu-tech/http-router/di` no longer exports the `REQUEST` token (`DiToken<IHttpReq>`).
- Registering the middleware with `router.use(registerRequest(container))` or resolving `REQUEST` from the container no longer compiles.

### Migration

The request-scoping middleware is planned to be reintroduced, rewritten using the new DI module component. Until then, no replacement is available.
