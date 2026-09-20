import { Redis } from "ioredis";

export const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
