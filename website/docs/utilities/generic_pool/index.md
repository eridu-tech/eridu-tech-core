---
sidebar_position: 7
tags:
    - Utilities
keywords:
    - Utilities
---

# Generic pool

The `eridu-tech/generic-pool` component reuses expensive resources instead of creating a new one for every call. The examples below pool SFTP connections created with `ssh2-sftp-client`, which are slow to open and cannot be shared by concurrent operations.

## Contracts

The contracts are exported from `eridu-tech/generic-pool/contracts`:

- `IResourceFactory` creates a resource, destroys it and optionally validates it before it is reused.
- `IGenericPoolBase` borrows a client with `acquireOrFail()`, returns it with `release()` and runs a callback with a client through `run()`.
- `IGenericPool` extends `IGenericPoolBase` with `close()`.

## QueuePool

`QueuePool` creates resources on demand and queues callers in first-in-first-out order when no resource is available. An `SftpClient` is connected when the pool creates it and ended when the pool destroys it:

```ts file=./samples/queue-pool.ts

```

The pool is configured with the following settings:

- `maxResources` - Maximum number of resources the pool can create. Default `10`.
- `maxWaitSize` - Maximum number of callers that can wait for a resource, `null` means no limit. Default `null`.

```ts file=./samples/queue-pool-settings.ts

```

Instead of `run()`, you can borrow a client manually. Always release it when you are done, preferably in a `finally` block:

```ts file=./samples/queue-pool-acquire-release.ts

```

A recycled connection is checked with the optional `IResourceFactory.validate()`. When it returns `false` or throws, the connection is ended and replaced, and the caller goes back to the front of the queue. Here `cwd()` reports whether the connection still responds:

```ts file=./samples/queue-pool-validate.ts

```

Closing the pool ends all idle connections and rejects every waiting caller. Connections that are still borrowed are ended when they are released:

```ts file=./samples/queue-pool-close.ts

```

## NoOpPool

`NoOpPool` gives the same client to every caller and ignores releases. Use it when the connection is already exclusive, for example when your application opens one connection itself:

```ts file=./samples/no-op-pool.ts

```

## Errors

`acquireOrFail()` rejects with `UnableToAcquireError` when a client cannot be acquired, for example when the wait queue is full or the pool has been closed:

```ts file=./samples/unable-to-acquire-error.ts

```

## Usage in the library

The FTP and SFTP file storage adapters use this component to pool their clients, so concurrent operations do not share one connection. For SFTP, `SftpFactory` is an `IResourceFactory<SftpClient>` and `sftpPool()` combines it with a pool, both available from `eridu-tech/file-storage/sftp-file-storage-adapter`.

## Further information

For further information refer to [`eridu-tech/generic-pool`](https://eridu-tech.github.io/eridu-tech-core/modules/GenericPool.html) API docs.
