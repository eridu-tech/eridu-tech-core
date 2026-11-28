import { MemoryRateLimiterAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-adapter";

const adapter = new MemoryRateLimiterAdapter();

await adapter.getState("api:login");
// -> checks rate limit for "api:login"
