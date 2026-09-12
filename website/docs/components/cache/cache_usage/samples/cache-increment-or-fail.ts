import { cache } from "./cache-initial-config.js";

await cache.incrementOrFail("ab", 1);
