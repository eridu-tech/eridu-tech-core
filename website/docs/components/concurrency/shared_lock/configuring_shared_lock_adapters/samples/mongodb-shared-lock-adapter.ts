import { MongodbSharedLockAdapter } from "eridu-tech/shared-lock/mongodb-shared-lock-adapter";
import { database } from "./mongodb-shared-lock-adapter-setup.js";

export const mongodbSharedLockAdapter = new MongodbSharedLockAdapter({
    database,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbSharedLockAdapter.init();
