---
"eridu-tech": minor
---

Added a dependency-injection aware HTTP middleware that opens a container scope for each request.

The new `eridu-tech/http-router/di` entrypoint exports `registerRequest`, which returns an `HttpMiddlewareFn` that runs the rest of the request inside `container.run()` with the incoming request registered under the `REQUEST` token. Handlers and services can then resolve the current request from the container instead of receiving it through every call:

```ts
import { Container } from "eridu-tech/di";
import { HttpRouter } from "eridu-tech/http-router";
import { REQUEST, registerRequest } from "eridu-tech/http-router/di";

const container = new Container({ executionContext });
const router = new HttpRouter({ router });

// Declares REQUEST as a dynamic token, so it must run before the container is initialized
// Important call it only once per di container at the root of the HttpRouter
router.use(registerRequest(container));
await container.init();

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: async ({ text }) => {
        const req = await container.resolveOrFail(REQUEST);
        return text(req.url);
    },
});
```

- `eridu-tech/http-router/di` exports `registerRequest` and the `REQUEST` token (`DiToken<IHttpReq>`).
- `registerRequest(container)` returns the middleware itself, so it is passed to `router.use()` or an endpoint's `use()` without being called again.

### Details

- `registerRequest` declares `REQUEST` as a dynamic token itself, so it has to be called before `container.init()` and only once per container. Calling it later throws `InvalidMethodCallDiError`, and calling it a second time throws `CanNotRegisterServiceDiError`.
- Every request is handled in its own container scope, so a request object never leaks into another request and scoped services stay isolated per request.
- The middleware uses the execution context to track run scopes, so the container needs a real execution-context adapter such as `AlsExecutionContextAdapter`; the no-op adapter stores no scope state and every request fails.
