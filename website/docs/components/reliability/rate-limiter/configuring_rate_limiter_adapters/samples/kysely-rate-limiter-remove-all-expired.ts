import { kyselyRateLimiterAdapter } from "./kysely-rate-limiter-adapter-sqlite.js";

// Remove all expired rate-limiter records manually.
await kyselyRateLimiterAdapter.removeAllExpired();
