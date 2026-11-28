---
"eridu-tech": minor
---

Make the Redis adapters explicitly initializable and align their behavior with the in-memory adapters.

## Breaking changes

- `RedisLockAdapter`, `RedisSemaphoreAdapter`, `RedisSharedLockAdapter`, `RedisCircuitBreakerAdapter` and `RedisRateLimiterAdapter` now implement `IInitizable`. Command registration moved from the constructor to `init()`, so `init()` must be called once before the first operation:

    ```ts
    const adapter = new RedisLockAdapter(redis);
    adapter.init();
    ```

    Calling `init()` more than once is a no-op.

- `RedisLockAdapter`, `RedisSemaphoreAdapter` and `RedisSharedLockAdapter` now take a settings object, so the Redis client is passed as `database`:

    ```ts
    const adapter = new RedisLockAdapter({ database: redis });
    adapter.init();
    ```

- The Redis lock adapter now stores `{ owner, expiration }` as JSON in the lock key, and the Redis shared lock adapter does the same for its writer key. Both used to store the bare owner id, so state written by older versions is not readable; drain in-flight locks before upgrading.

- The Redis adapters wrap the key they receive in a Redis hash tag by default, e.g. `lock` becomes `{lock}`, so keys with the same name share one hash slot and work with Redis Cluster and sharded deployments. This applies to `RedisLockAdapter`, `RedisSemaphoreAdapter`, `RedisSharedLockAdapter`, `RedisRateLimiterAdapter` and `RedisCircuitBreakerAdapter`; the semaphore stores its state in `{key}` and `{key}__limit`, and the shared lock stores its state in `{key}__writer`, `{key}__reader` and `{key}__reader__limit`. Every one of these adapters takes a `useShardingKey` setting, set it to `false` to keep the plain key. State written by older versions lives under the old key names; drain in-flight state before upgrading.

## Bug fixes and improvements

- Every Redis adapter except `RedisCacheAdapter` (`RedisCircuitBreakerAdapter`, `RedisEventBusAdapter`, `RedisLockAdapter`, `RedisRateLimiterAdapter`, `RedisSemaphoreAdapter` and `RedisSharedLockAdapter`) now accepts either a standalone ioredis `Redis` client or an ioredis `Cluster` client.

- Expirations are unix timestamps in milliseconds and Redis key TTLs are relative, so clock drift between the application and the Redis server no longer expires state early. The Redis semaphore and shared lock reader keys now actually receive a TTL: the previous max-expiration lookup read the score-0 range, so keys with only expirable slots never expired.
- The Redis adapters now follow their in-memory counterparts:
    - `RedisLockAdapter`: re-acquiring a lock you already own updates its stored state and expiration, and `getState` reads the expiration from the stored state instead of `PEXPIRETIME`.
    - `RedisSemaphoreAdapter`: the limit is reset by the next acquire once every slot has been released or has expired.
    - `RedisSharedLockAdapter`: an expired writer lock no longer blocks readers, and expired-only reader slots no longer block writers.
