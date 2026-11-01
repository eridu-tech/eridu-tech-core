import { lockFactory } from "./lock-factory-resolver-di-factory.js";

// Uses the Redis adapter
await lockFactory
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
