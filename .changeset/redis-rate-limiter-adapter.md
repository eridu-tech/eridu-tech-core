---
"eridu-tech": minor
---

Update `RedisRateLimiterAdapter` to work with Redis Cluster and fix its expiry and backoff handling.

## Breaking changes

- The adapter implements `IInitizable`: call `init()` once before the first operation. Calling `init()` more than once is a no-op.
- Keys are wrapped in a Redis hash tag by default, so state written by older versions lives under the old key name. See **Redis Cluster support** below.

## Redis Cluster support

- Accepts either a standalone ioredis `Redis` client or an ioredis `Cluster` client.
- Uses Redis Cluster shard keys (hash tags) by default: `user` is stored as `{user}`, so keys with the same name share one hash slot. Pass `useShardingKey: false` to keep the plain key; keys that already contain a hash tag are not wrapped twice.

## Bug fixes and improvements

- The adapter no longer drops stored attempts when the Redis server clock runs ahead of the application clock. Entries were written with an absolute expiry taken from the application clock, so with enough clock drift the key expired the moment it was written and the limiter silently reset on every call. Expiry is now relative.
- The exponential, linear and polynomial backoff delays evaluated in Redis now match their in-process counterparts. The exponential delay was computed as `min(maxDelay, minDelay, multiplier^attempt)` instead of `min(maxDelay, minDelay * multiplier^attempt)`, which produced delays far below the configured minimum.
