import { withRateLimiterLogging } from "eridu-tech/rate-limiter/plugins";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { withPlugin } from "eridu-tech/middleware";

const logger = new Logger({
    transport: new ConsoleLoggerTransport(),
});

const adapter = new DatabaseRateLimiterAdapter({
    adapter: new MemoryRateLimiterStorageAdapter(),
});

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withRateLimiterLogging(logger));
