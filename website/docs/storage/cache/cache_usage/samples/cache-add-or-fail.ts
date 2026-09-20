import { cache } from "./cache-initial-config.js";

await cache.addOrFail("ab", 1);
