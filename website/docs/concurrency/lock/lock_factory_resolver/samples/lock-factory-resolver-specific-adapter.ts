import { lockFactoryResolver } from "./lock-factory-resolver-initial-config.js";

await lockFactoryResolver
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
