import { MongodbCacheAdapter } from "eridu-tech/cache/mongodb-cache-adapter";
import { database, serde } from "./mongodb-cache-adapter-setup.js";

const mongodbCacheAdapter = new MongodbCacheAdapter({
    database,
    serde,
    // By default "cache" is used as collection name
    collectionName: "my-cache",
});

await mongodbCacheAdapter.init();
