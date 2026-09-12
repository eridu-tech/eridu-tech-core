import { semaphoreFactory } from "./semaphore-factory-initial-config.js";

const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
});

await semaphore.runOrFail(async () => {
    // ... critical section
});
