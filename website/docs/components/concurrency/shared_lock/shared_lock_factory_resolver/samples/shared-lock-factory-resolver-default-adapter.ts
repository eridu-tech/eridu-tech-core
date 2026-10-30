import { sharedLockFactoryResolver } from "./shared-lock-factory-resolver-initial-config.js";

await sharedLockFactoryResolver
    .use()
    .create("shared-resource", {
        limit: 4,
    })
    .runWriterOrFail(async () => {
        // code to run
    });
