import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";
import { transactionContext } from "./transaction-context.js";

const client = new Redis("YOUR_REDIS_CONNECTION_STRING");
const serde = new SuperJsonSerde();
const eventBusAdapter = new RedisPubSubEventBusAdapter({
    client,
    serde,
    // Immediately outside a transaction, after commit inside transaction
    transactionHooks: transactionContext,
});
