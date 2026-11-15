---
"eridu-tech": minor
---

`FtpFactory.destroy` now waits for the client connection to close.

- `destroy(client)` returns `Promise<void>` and resolves only after the FTP control socket has emitted `close`, so a destroyed client is fully shut down before the pool frees the resource slot and creates or hands out another one.
- `Client.close()` from `basic-ftp` is synchronous and only starts the teardown, so the previous `void` implementation released the slot while the socket was still closing.
- `IResourceFactory.destroy` already accepts `Promisable<void>`, so the resource factory contract is unchanged. Only direct callers of `FtpFactory.destroy` are affected: they must `await` the returned promise if they relied on the connection being gone afterwards.
