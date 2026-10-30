import { sharedLockFactory } from "./shared-lock-factory-resolver-di-factory.js";

// Uses the adapter configured as the default (memory)
await sharedLockFactory
    .create("shared-resource", {
        limit: 4,
    })
    .runWriterOrFail(async () => {
        // code to run
    });
