import { MongodbSemaphoreAdapter } from "eridu-tech/semaphore/mongodb-semaphore-adapter";
import { database } from "./mongodb-semaphore-adapter-setup.js";

export const mongodbSemaphoreAdapter = new MongodbSemaphoreAdapter({
    database,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbSemaphoreAdapter.init();
