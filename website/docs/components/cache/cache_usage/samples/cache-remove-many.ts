import { cache } from "./cache-initial-config.js";

await cache.removeMany(["a", "b"]);
