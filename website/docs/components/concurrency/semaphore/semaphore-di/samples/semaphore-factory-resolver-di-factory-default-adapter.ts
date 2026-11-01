import { semaphoreFactory } from "./semaphore-factory-resolver-di-factory.js";

// Uses the adapter configured as the default (memory)
await semaphoreFactory
    .create("shared-resource", {
        limit: 2,
    })
    .runOrFail(async () => {
        // code to run
    });
