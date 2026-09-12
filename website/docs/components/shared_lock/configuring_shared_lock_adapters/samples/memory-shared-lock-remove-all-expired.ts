import { memorySharedLockAdapter } from "./memory-shared-lock-adapter.js";

// Remove all expired shared-lock keys manually.
await memorySharedLockAdapter.removeAllExpired();
