---
"eridu-tech": minor
---

Added a dependency-injection aware controller binder to the `eridu-tech/http-router/di` entrypoint.

`bindHttpFactory(container)` returns a binder that turns a controller method into an `HttpHandlerFn`. The binder takes the controller's token and the name of one of its handler methods, resolves the controller from the container for each request, and invokes the bound method:

```ts
import { bindHttpFactory } from "eridu-tech/http-router/di";
import type { HttpHandlerFn } from "eridu-tech/http-router/contracts";

class UsersController {
    getUser: HttpHandlerFn = ({ text }) => text("Hi from UsersController");
}

const bindHttp = bindHttpFactory(container);

router.endpoint({
    method: "GET",
    url: "/users/:id",
    handler: bindHttp(UsersController, "getUser"),
});
```

- `eridu-tech/http-router/di` exports `bindHttpFactory`.
- The binder resolves the controller with `container.resolveOrFail` on every request, so the controller's lifetime follows its container registration.
- The resulting handler throws `UnexpectedError` when the bound member is not invocable.
