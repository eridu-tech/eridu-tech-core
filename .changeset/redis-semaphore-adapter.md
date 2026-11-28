---
"eridu-tech": minor
---

Update `RedisSemaphoreAdapter` to mirror `MemorySemaphoreAdapter` and to work with Redis Cluster.

## Breaking changes

- The adapter now takes `RedisSemaphoreAdapterSettings`, so the Redis client is passed as `database`:

    ```ts
    const adapter = new RedisSemaphoreAdapter({ database: redis });
    adapter.init();
    ```

- The adapter implements `IInitizable`: call `init()` once before the first operation. Calling `init()` more than once is a no-op.
- Keys are wrapped in a Redis hash tag by default, so state written by older versions lives under the old key names. See **Redis Cluster support** below.

## Redis Cluster support

- Accepts either a standalone ioredis `Redis` client or an ioredis `Cluster` client.
- Uses Redis Cluster shard keys (hash tags) by default: the semaphore stores its state under `{key}` and `{key}__limit`, so both keys share one hash slot. Pass `useShardingKey: false` to keep the plain keys; keys that already contain a hash tag are not wrapped twice.

## Bug fixes and improvements

- Expirations are unix timestamps in milliseconds and the key TTLs are relative, so clock drift between the application and the Redis server no longer expires state early.
- The semaphore keys now actually receive a TTL: the previous max-expiration lookup read the score-0 range, so keys with only expirable slots never expired.
- The limit is reset by the next acquire once every slot has been released or has expired, matching `MemorySemaphoreAdapter`.
