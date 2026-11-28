import { Redis } from "ioredis";
import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import type { ISharedLock } from "eridu-tech/shared-lock/contracts";
import { SharedLockFactory } from "eridu-tech/shared-lock";
import { RedisEventBusAdapter } from "eridu-tech/event-bus/redis-event-bus-adapter";
import { EventBus } from "eridu-tech/event-bus";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();
const redis = new Redis("YOUR_REDIS_CONNECTION", {
    lazyConnect: true,
});
await redis.connect();

type EventMap = {
    "sending-shared-lock-over-network": {
        sharedLock: ISharedLock;
    };
};
const eventBus = new EventBus<EventMap>({
    adapter: new RedisEventBusAdapter({
        client: redis,
        serde,
    }),
});

const redisSharedLockAdapter = new RedisSharedLockAdapter({ database: redis });
redisSharedLockAdapter.init();

const sharedLockFactory = new SharedLockFactory({
    serde,
    adapter: redisSharedLockAdapter,
});
const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});

// We are sending the shared-lock over the network to other servers.
await eventBus.dispatch("sending-shared-lock-over-network", {
    sharedLock,
});

// The other servers will recieve the serialized shared-lock and automattically deserialize it.
await eventBus.addListener(
    "sending-shared-lock-over-network",
    ({ sharedLock }) => {
        // The shared-lock is deserialized and can be used
        console.log("SHARED_LOCK:", sharedLock);
    },
);
