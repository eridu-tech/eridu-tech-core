import { semaphoreFactoryResolver } from "./semaphore-factory-resolver-initial-config.js";

await semaphoreFactoryResolver
    .use("redis")
    .create("shared-resource", {
        limit: 2,
    })
    .runOrFail(async () => {
        // code to run
    });
