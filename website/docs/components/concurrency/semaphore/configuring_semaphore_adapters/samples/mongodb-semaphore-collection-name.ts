import { MongodbSemaphoreAdapter } from "eridu-tech/semaphore/mongodb-semaphore-adapter";
import { database } from "./mongodb-semaphore-adapter-setup.js";

const mongodbSemaphoreAdapter = new MongodbSemaphoreAdapter({
    database,
    // By default "semaphore" is used as collection name
    collectionName: "my-semaphore",
});

await mongodbSemaphoreAdapter.init();
