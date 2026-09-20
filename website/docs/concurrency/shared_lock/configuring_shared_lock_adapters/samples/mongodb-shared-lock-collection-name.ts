import { MongodbSharedLockAdapter } from "eridu-tech/shared-lock/mongodb-shared-lock-adapter";
import { database } from "./mongodb-shared-lock-adapter-setup.js";

const mongodbSharedLockAdapter = new MongodbSharedLockAdapter({
    database,
    // By default "shared-lock" is used as collection name
    collectionName: "my-shared-lock",
});

await mongodbSharedLockAdapter.init();
