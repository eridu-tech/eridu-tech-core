import { sharedLockFactory } from "./shared-lock-factory-initial-config.js";

const sharedLock = sharedLockFactory.create("shared-lock", {
    limit: 2,
    lockId: "my-shared-lock-id",
});

const hasAcquire = await sharedLock.acquireWriter();
if (hasAcquire) {
    console.log("Shared resource");
    await sharedLock.releaseWriter();
}
