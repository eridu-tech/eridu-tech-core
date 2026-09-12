import { cache } from "./cache-initial-config.js";

await cache.removeOrFail("ab");
