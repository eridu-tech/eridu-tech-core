import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

export const redisCacheAdapter = new RedisCacheAdapter({
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
    serde: new SuperJsonSerde(),
});
