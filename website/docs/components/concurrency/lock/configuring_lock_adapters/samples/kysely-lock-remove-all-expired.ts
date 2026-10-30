import { kyselyLockAdapter } from "./kysely-lock-sqlite.js";

// Remove all expired lock keys manually.
await kyselyLockAdapter.removeAllExpired();
