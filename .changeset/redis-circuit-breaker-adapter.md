---
"eridu-tech": minor
---

Update `RedisCircuitBreakerAdapter` to work with Redis Cluster and fix its backoff delays.

## Breaking changes

- The adapter implements `IInitizable`: call `init()` once before the first operation. Calling `init()` more than once is a no-op.
- Keys are wrapped in a Redis hash tag by default, so state written by older versions lives under the old key name. See **Redis Cluster support** below.

## Redis Cluster support

- Accepts either a standalone ioredis `Redis` client or an ioredis `Cluster` client.
- Uses Redis Cluster shard keys (hash tags) by default: `user` is stored as `{user}`, so keys with the same name share one hash slot. Pass `useShardingKey: false` to keep the plain key; keys that already contain a hash tag are not wrapped twice.

## Bug fixes and improvements

- The exponential, linear and polynomial backoff delays evaluated in Redis now match their in-process counterparts. The exponential delay was computed as `min(maxDelay, minDelay, multiplier^attempt)` instead of `min(maxDelay, minDelay * multiplier^attempt)`, which produced delays far below the configured minimum.
