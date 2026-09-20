import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { database, serde } from "./redis-cache-adapter-setup.js";

const redisCacheAdapter = new RedisCacheAdapter({
    database,
    serde,
});
