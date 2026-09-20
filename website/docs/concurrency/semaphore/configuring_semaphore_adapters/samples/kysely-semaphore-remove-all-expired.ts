import { kyselySemaphoreAdapter } from "./kysely-semaphore-sqlite.js";

// Remove all expired semaphore keys manually.
await kyselySemaphoreAdapter.removeAllExpired();
