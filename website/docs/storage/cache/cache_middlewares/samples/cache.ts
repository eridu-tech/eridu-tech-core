import { Cache } from "eridu-tech/cache";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";

export const cache = new Cache({
    adapter: new MemoryCacheAdapter(),
});
