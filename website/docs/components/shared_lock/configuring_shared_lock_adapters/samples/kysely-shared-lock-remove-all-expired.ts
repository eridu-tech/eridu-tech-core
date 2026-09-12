import { kyselySharedLockAdapter } from "./kysely-shared-lock-sqlite.js";

// Remove all expired shared-lock keys manually.
await kyselySharedLockAdapter.removeAllExpired();
