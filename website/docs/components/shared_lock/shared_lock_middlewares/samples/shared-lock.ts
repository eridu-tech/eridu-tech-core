import { SharedLockFactory } from "eridu-tech/shared-lock";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

export const sharedLockFactory = new SharedLockFactory({
    adapter: new MemorySharedLockAdapter(),
});
