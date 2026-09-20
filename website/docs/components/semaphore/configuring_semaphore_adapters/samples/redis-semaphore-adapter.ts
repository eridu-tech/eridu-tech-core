import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import { database } from "./redis-semaphore-adapter-setup.js";

const redisSemaphoreAdapter = new RedisSemaphoreAdapter(database);
