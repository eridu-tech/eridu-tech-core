import { sharedLockFactory } from "./shared-lock-factory-initial-config.js";

export const sharedLock = sharedLockFactory.create("shared-resource", {
    // You need to define a limit
    limit: 2,
});
