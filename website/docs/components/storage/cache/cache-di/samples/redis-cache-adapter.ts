import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

export const redisCacheAdapter = new RedisCacheAdapter({
    database,
    serde: new SuperJsonSerde(),
});
