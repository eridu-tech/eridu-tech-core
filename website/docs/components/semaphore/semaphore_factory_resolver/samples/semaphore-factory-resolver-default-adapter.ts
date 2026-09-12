import { semaphoreFactoryResolver } from "./semaphore-factory-resolver-initial-config.js";

await semaphoreFactoryResolver
    .use()
    .create("shared-resource", {
        limit: 2,
    })
    .runOrFail(async () => {
        // code to run
    });
