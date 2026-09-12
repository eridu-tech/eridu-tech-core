import { kyselyRateLimiterStorageAdapter } from "./kysely-storage-sqlite.js";

// Remove all expired rate-limiter records manually.
await kyselyRateLimiterStorageAdapter.removeAllExpired();
