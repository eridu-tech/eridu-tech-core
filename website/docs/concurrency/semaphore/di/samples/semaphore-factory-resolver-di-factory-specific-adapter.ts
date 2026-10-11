import { semaphoreFactory } from "./semaphore-factory-resolver-di-factory.js";

// Uses the storage2 adapter
await semaphoreFactory
    .use("storage2")
    .create("shared-resource", {
        limit: 2,
    })
    .runOrFail(async () => {
        // code to run
    });
