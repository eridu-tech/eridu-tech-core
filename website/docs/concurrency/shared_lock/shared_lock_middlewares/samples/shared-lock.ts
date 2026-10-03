import { SharedLockFactoryResolver } from "eridu-tech/shared-lock";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

export const sharedLockFactoryResolver = new SharedLockFactoryResolver({
    adapters: {
        storage1: new MemorySharedLockAdapter(),
        storage2: new MemorySharedLockAdapter(),
    },
    defaultAdapter: "storage1",
});
