import { kyselyCacheAdapter } from "./kysely-cache-sqlite.js";

// Remove all expired cache keys manually.
await kyselyCacheAdapter.removeAllExpired();
