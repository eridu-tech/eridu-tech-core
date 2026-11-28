import { withPlugin } from "eridu-tech/middleware";
import { MemoryRateLimiterAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-adapter";
import { withRateLimiterPrefix } from "eridu-tech/rate-limiter/plugins";

const adapter = new MemoryRateLimiterAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(
    adapter,
    withRateLimiterPrefix("tenant-42:"),
);
