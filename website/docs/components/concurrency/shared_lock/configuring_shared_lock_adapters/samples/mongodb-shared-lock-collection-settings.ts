import { MongodbSharedLockAdapter } from "eridu-tech/shared-lock/mongodb-shared-lock-adapter";
import { database } from "./mongodb-shared-lock-adapter-setup.js";

const mongodbSharedLockAdapter = new MongodbSharedLockAdapter({
    database,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbSharedLockAdapter.init();
