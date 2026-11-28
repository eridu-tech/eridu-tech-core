---
"eridu-tech": minor
---

Rename the Redis event bus adapter and fix listener removal.

## Breaking changes

- `RedisPubSubEventBusAdapter` is now `RedisEventBusAdapter`, and `RedisPubSubEventBusAdapterSettings` is now `RedisEventBusAdapterSettings`.
- The package subpath `eridu-tech/event-bus/redis-pub-sub-event-bus-adapter` is now `eridu-tech/event-bus/redis-event-bus-adapter`.
- Channel names are wrapped in a Redis hash tag by default, so publishers outside this adapter must publish to the hashed channel name, e.g. `{event}`. See **Redis Cluster support** below.

## Bug fixes

- **Removing one listener no longer disables the others.** `removeListener` used to call `unsubscribe(eventName)` on every removal, which unsubscribes the whole Redis channel. It now unsubscribes only when the last listener for that event is removed.
- **A single Redis message no longer invokes listeners multiple times.** The `"message"` handler used to be registered again on every `addListener` call, so each message ran through every registered copy of the handler. It is now registered once, and `addListener` subscribes only when the first listener for an event is added.

## Tests

- The adapter test suite now covers two listeners on one event, removing one, and the remaining listener still receiving the event.

## Redis Cluster support

- Accepts either a standalone ioredis `Redis` client or an ioredis `Cluster` client.
- Uses Redis Cluster shard keys (hash tags) by default: `event` becomes `{event}`, and the adapter publishes and subscribes with `SPUBLISH`/`SSUBSCRIBE`, so sharded pub/sub works on Redis Cluster. Pass `useShardingKey: false` to keep the plain channel name; channel names that already contain a hash tag are not wrapped twice.
- Tests cover the hashed channel names and event delivery through a cluster client.
