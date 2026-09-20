import { cache } from "./cache-initial-config.js";

await cache.updateOrFail("ab", 1);
