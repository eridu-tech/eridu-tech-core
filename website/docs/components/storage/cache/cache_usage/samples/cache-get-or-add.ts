import { cache } from "./cache-initial-config.js";

await cache.getOrAdd("ab", 1);
