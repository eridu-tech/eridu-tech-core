import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import { database } from "./redis-shared-lock-adapter-setup.js";

const redisSharedLockAdapter = new RedisSharedLockAdapter(database);
