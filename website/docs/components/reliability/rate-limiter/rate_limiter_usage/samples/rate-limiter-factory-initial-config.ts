import { MemoryRateLimiterAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-adapter";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";

export const rateLimiterFactory = new RateLimiterFactory({
    // You can provide default settings
    // You can choose the adapter to use
    adapter: new MemoryRateLimiterAdapter(),
});

await rateLimiterFactory.init();
