---
"eridu-tech": patch
---

Fixed the route paths of `HttpRouter` so an endpoint is reachable at the path it was registered with, whatever slashes are used.

- A registered path never contains `//` anymore. Previously the prefix and the endpoint URL were joined and the doubled slashes collapsed afterwards, so the default prefix `/` plus `/users` registered `//users` and every request to `/users` answered `404`.
- Slashes were collapsed one pair at a time, so a prefix written as `baseUrl: "/api/"` or `group("/api/", ...)` left every endpoint under it unreachable.
- Leading, trailing and repeated slashes now resolve to one prefix: `"api"`, `"/api"`, `"/api/"` and `"//api//"` are the same, and a slashes-only prefix is the root path `/`.
- The request path is normalized the same way before matching, so `GET /users` and `GET /users/` both reach the endpoint registered at `/users`.
