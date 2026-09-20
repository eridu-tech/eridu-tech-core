import { MongodbCacheAdapter } from "eridu-tech/cache/mongodb-cache-adapter";
import { database, serde } from "./mongodb-cache-adapter-setup.js";

const mongodbCacheAdapter = new MongodbCacheAdapter({
    database,
    serde,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbCacheAdapter.init();
