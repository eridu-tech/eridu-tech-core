---
"eridu-tech": minor
---

Added a dependency-injection aware middleware binder to the `eridu-tech/http-router/di` entrypoint.

`bindHttpMiddlewareFactory(container)` returns a binder that turns a middleware registered in the container into an `HttpMiddlewareFn`. The binder takes the middleware's token, resolves the middleware from the container for each request, and invokes it with the middleware arguments:

```ts
import { Container } from "eridu-tech/di";
import { genericToken } from "eridu-tech/di/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { bindHttpMiddlewareFactory } from "eridu-tech/http-router/di";

import type { HttpMiddleware } from "eridu-tech/http-router/contracts";

const container = new Container({
    executionContext: new ExecutionContext(new AlsExecutionContextAdapter()),
});
const router = new HttpRouter({ router: defaultHttpRouterAdapter() });

const requestLoggerToken = genericToken<HttpMiddleware>("requestLogger");

container.registerValue({
    token: requestLoggerToken,
    value: {
        async invoke({ next, req }) {
            console.log(`${req.method} ${req.url}`);
            return next();
        },
    },
});

await container.init();

router.use(bindHttpMiddlewareFactory(container)(requestLoggerToken));
```

- `eridu-tech/http-router/di` exports `bindHttpMiddlewareFactory`.
- The binder resolves the middleware with `container.resolveOrFail` on every request, so the middleware's lifetime follows its container registration.
- Both middleware functions and invocable objects (values with an `invoke` method) are supported.
- The resulting middleware throws `UnexpectedError` when the resolved middleware is not invocable.
