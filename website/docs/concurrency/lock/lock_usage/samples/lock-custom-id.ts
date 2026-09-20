import { lockFactory } from "./lock-factory-initial-config.js";

const lock = lockFactory.create("lock", {
    lockId: "my-lock-id",
});

const hasAcquire = await lock.acquire();
if (hasAcquire) {
    console.log("Shared resource");
    await lock.release();
}
