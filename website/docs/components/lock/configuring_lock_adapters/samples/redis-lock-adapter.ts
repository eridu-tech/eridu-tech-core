import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import { database } from "./redis-lock-adapter-setup.js";

const redisLockAdapter = new RedisLockAdapter(database);
