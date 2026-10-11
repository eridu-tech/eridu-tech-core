import { LockFactoryResolver } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";

export const lockFactoryResolver = new LockFactoryResolver({
    adapters: {
        storage1: new MemoryLockAdapter(),
        storage2: new MemoryLockAdapter(),
    },
    defaultAdapter: "storage1",
});
