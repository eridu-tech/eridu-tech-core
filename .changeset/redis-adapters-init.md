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

- The Redis lock adapter now stores `{ owner, expiration }` as JSON in the lock key, and the Redis shared lock adapter does the same for its writer key. Both used to store the bare owner id, so state written by older versions is not readable; drain in-flight locks before upgrading.

## Bug fixes and improvements

- Expirations are unix timestamps in milliseconds and Redis key TTLs are relative, so clock drift between the application and the Redis server no longer expires state early. The Redis semaphore and shared lock reader keys now actually receive a TTL: the previous max-expiration lookup read the score-0 range, so keys with only expirable slots never expired.
- The Redis adapters now follow their in-memory counterparts:
    - `RedisLockAdapter`: re-acquiring a lock you already own updates its stored state and expiration, and `getState` reads the expiration from the stored state instead of `PEXPIRETIME`.
    - `RedisSemaphoreAdapter`: the limit is reset by the next acquire once every slot has been released or has expired.
    - `RedisSharedLockAdapter`: an expired writer lock no longer blocks readers, and expired-only reader slots no longer block writers.
