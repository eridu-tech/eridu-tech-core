import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

export const serde = new SuperJsonSerde();

export const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
