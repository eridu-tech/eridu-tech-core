import { ToLockAdapter } from "eridu-tech/lock/to-lock-adapter";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

export const toLockAdapter = new ToLockAdapter(new MemorySharedLockAdapter());
