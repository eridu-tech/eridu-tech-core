import { MongodbLockAdapter } from "eridu-tech/lock/mongodb-lock-adapter";
import { database } from "./mongodb-lock-adapter-setup.js";

export const mongodbLockAdapter = new MongodbLockAdapter({
    database,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbLockAdapter.init();
