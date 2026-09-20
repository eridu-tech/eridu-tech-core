import { MongodbSemaphoreAdapter } from "eridu-tech/semaphore/mongodb-semaphore-adapter";
import { database } from "./mongodb-semaphore-adapter-setup.js";

const mongodbSemaphoreAdapter = new MongodbSemaphoreAdapter({
    database,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbSemaphoreAdapter.init();
