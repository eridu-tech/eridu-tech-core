---
"eridu-tech": minor
---

Turned `defaultHttpRouterAdapter` into a factory that returns a new adapter on every call.

- `defaultHttpRouterAdapter()` returns a fresh `SmartRouter` instance, so `HttpRouter` instances no longer share one route matcher. Hono's `SmartRouter` builds and freezes its matcher on the first matched request, so a shared adapter both rejected route registrations made after that request and let one router serve another router's routes.

    ### Breaking changes
    - `defaultHttpRouterAdapter` is a function now, so it has to be called when it is passed to `HttpRouterSettings.router`.

    ### Migration

    **Before:**

    ```ts
    import {
        HttpRouter,
        defaultHttpRouterAdapter,
    } from "eridu-tech/http-router";

    const router = new HttpRouter({ router: defaultHttpRouterAdapter });
    ```

    **After:**

    ```ts
    import {
        HttpRouter,
        defaultHttpRouterAdapter,
    } from "eridu-tech/http-router";

    const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
    ```
