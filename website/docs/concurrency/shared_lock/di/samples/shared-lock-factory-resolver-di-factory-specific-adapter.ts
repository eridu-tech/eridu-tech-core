import { sharedLockFactory } from "./shared-lock-factory-resolver-di-factory.js";

// Uses the storage2 adapter
await sharedLockFactory
    .use("storage2")
    .create("shared-resource", {
        limit: 4,
    })
    .runWriterOrFail(async () => {
        // code to run
    });
