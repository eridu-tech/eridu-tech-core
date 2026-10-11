import { lockFactory } from "./lock-factory-resolver-di-factory.js";

// Uses the storage2 adapter
await lockFactory
    .use("storage2")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
