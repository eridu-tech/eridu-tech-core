import { lockFactoryResolver } from "./lock-factory-resolver-initial-config.js";

await lockFactoryResolver
    .use()
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
