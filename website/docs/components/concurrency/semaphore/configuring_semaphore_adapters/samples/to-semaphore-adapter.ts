import { ToSemaphoreAdapter } from "eridu-tech/semaphore/to-semaphore-adapter";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

export const toSemaphoreAdapter = new ToSemaphoreAdapter(
    new MemorySharedLockAdapter(),
);
