---
"eridu-tech": patch
---

Tightened the `WinterTcRequestHandler` return type from `Promisable<Response>` to `Promise<Response>`.

- Implementations must now return a promise, so a handler that returned a `Response` synchronously has to be declared `async` or return `Promise.resolve(response)`.
- Removed the now unused `Promisable` import from the contract file.
