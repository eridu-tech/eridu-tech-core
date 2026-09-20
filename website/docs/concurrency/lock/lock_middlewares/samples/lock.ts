import { LockFactory } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";

export const lockFactory = new LockFactory({
    adapter: new MemoryLockAdapter(),
});
