import { sharedLockFactory } from "./shared-lock-factory-resolver-di-factory.js";

// Uses the Redis adapter
await sharedLockFactory
    .use("redis")
    .create("shared-resource", {
        limit: 4,
    })
    .runWriterOrFail(async () => {
        // code to run
    });
