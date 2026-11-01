import { cache } from "./cache-initial-config.js";

await cache.getOr("ab", 1);
