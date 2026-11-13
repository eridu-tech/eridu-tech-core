import { withRateLimiterLogging } from "eridu-tech/rate-limiter/plugins";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { Log } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { withPlugin } from "eridu-tech/middleware";

const log = new Log({
    transport: new ConsoleLogTransport(),
});

const adapter = new DatabaseRateLimiterAdapter({
    adapter: new MemoryRateLimiterStorageAdapter(),
});

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withRateLimiterLogging(log));
