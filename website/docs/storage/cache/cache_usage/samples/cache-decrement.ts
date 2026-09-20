import { cache } from "./cache-initial-config.js";

await cache.decrement("a", 1);
