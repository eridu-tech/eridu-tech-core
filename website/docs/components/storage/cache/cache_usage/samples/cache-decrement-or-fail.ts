import { cache } from "./cache-initial-config.js";

await cache.decrementOrFail("ab", 1);
