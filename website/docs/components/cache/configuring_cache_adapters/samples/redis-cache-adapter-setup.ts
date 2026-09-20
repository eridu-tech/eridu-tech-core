import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { Redis } from "ioredis";

export const serde = new Serde(new SuperJsonSerdeAdapter());

export const database = new Redis("YOUR_REDIS_CONNECTION_STRING");
