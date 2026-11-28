---
"eridu-tech": minor
---

Update `RedisLockAdapter` to mirror `MemoryLockAdapter` and to work with Redis Cluster.

## Breaking changes

- The adapter now takes `RedisLockAdapterSettings`, so the Redis client is passed as `database`:

    ```ts
    const adapter = new RedisLockAdapter({ database: redis });
    adapter.init();
    ```

- The adapter implements `IInitizable`: call `init()` once before the first operation. Calling `init()` more than once is a no-op.
- The lock key stores `{ owner, expiration }` as JSON instead of the bare owner id, so state written by older versions is not readable. Drain in-flight locks before upgrading.
- Keys are wrapped in a Redis hash tag by default, so state written by older versions lives under the old key name. See **Redis Cluster support** below.

## Redis Cluster support

- Accepts either a standalone ioredis `Redis` client or an ioredis `Cluster` client.
- Uses Redis Cluster shard keys (hash tags) by default: `lock` is stored as `{lock}`, so keys with the same name share one hash slot. Pass `useShardingKey: false` to keep the plain key; keys that already contain a hash tag are not wrapped twice.

## Bug fixes and improvements

- Expirations are unix timestamps in milliseconds and the key TTL is relative, so clock drift between the application and the Redis server no longer expires the lock early.
- Re-acquiring a lock you already own updates its stored expiration, and `getState` reads the expiration from the stored state instead of `PEXPIRETIME`.
