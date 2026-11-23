---
"eridu-tech": minor
---

Rename the Redis event bus adapter.

- `RedisPubSubEventBusAdapter` is now `RedisEventBusAdapter`, and `RedisPubSubEventBusAdapterSettings` is now `RedisEventBusAdapterSettings`.
- The package subpath `eridu-tech/event-bus/redis-pub-sub-event-bus-adapter` is now `eridu-tech/event-bus/redis-event-bus-adapter`. Update your imports accordingly.
- The adapter still uses Redis pub/sub under the hood; its behavior is unchanged.
