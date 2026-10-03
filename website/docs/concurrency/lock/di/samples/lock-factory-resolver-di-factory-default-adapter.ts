import { lockFactory } from "./lock-factory-resolver-di-factory.js";

// Uses the adapter configured as the default (storage1)
await lockFactory.create("shared-resource").runOrFail(async () => {
    // code to run
});
