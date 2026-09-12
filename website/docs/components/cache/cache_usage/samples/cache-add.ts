import { cache } from "./cache-initial-config.js";
import { TimeSpan } from "eridu-tech/time-span";

await cache.add("a", "value", TimeSpan.fromSeconds(1));
