import { semaphoreFactory } from "./semaphore-factory-resolver-di-factory.js";

// Uses the Redis adapter
await semaphoreFactory
    .use("redis")
    .create("shared-resource", {
        limit: 2,
    })
    .runOrFail(async () => {
        // code to run
    });
