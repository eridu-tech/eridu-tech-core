---
"eridu-tech": minor
---

Added an optional `baseUrl` setting to `HttpRouter`.

- `baseUrl` is a path prefix prepended to every route registered on the router, so the router can be mounted under a sub-path without repeating the prefix on each endpoint. For example, with `baseUrl: "/api"` an endpoint registered at `/users` responds to `GET /api/users`.
- `baseUrl` defaults to `"/"`, which preserves the previous routing behavior.
- Fixed `HttpRouterBase.endpoint()` so it prepends the router prefix to endpoint URLs. Routes registered inside `group(prefix, ...)` are now served under that prefix, as documented, instead of being registered at their raw path.
