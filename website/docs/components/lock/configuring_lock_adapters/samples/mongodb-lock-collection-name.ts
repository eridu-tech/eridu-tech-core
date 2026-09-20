import { MongodbLockAdapter } from "eridu-tech/lock/mongodb-lock-adapter";
import { database } from "./mongodb-lock-adapter-setup.js";

const mongodbLockAdapter = new MongodbLockAdapter({
    database,
    // By default "lock" is used as collection name
    collectionName: "my-lock",
});

await mongodbLockAdapter.init();
