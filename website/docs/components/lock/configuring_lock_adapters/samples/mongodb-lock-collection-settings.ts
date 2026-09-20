import { MongodbLockAdapter } from "eridu-tech/lock/mongodb-lock-adapter";
import { database } from "./mongodb-lock-adapter-setup.js";

const mongodbLockAdapter = new MongodbLockAdapter({
    database,
    // You configure additional collection settings
    collectionSettings: {},
});

await mongodbLockAdapter.init();
