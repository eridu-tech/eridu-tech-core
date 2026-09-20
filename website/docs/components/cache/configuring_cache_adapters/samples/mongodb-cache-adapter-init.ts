import { MongodbCacheAdapter } from "eridu-tech/cache/mongodb-cache-adapter";
import { database, serde } from "./mongodb-cache-adapter-setup.js";

export const mongodbCacheAdapter = new MongodbCacheAdapter({
    database,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbCacheAdapter.init();
