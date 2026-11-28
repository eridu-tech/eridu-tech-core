import { MemoryRateLimiterAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-adapter";

const memoryRateLimiterAdapter = new MemoryRateLimiterAdapter();

// Remove all expired rate-limiter records manually.
memoryRateLimiterAdapter.removeAllExpired();
