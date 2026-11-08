import { withCircuitBreakerLogging } from "eridu-tech/circuit-breaker/plugins";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { withPlugin } from "eridu-tech/middleware";

const logger = new Logger({
    transport: new ConsoleLoggerTransport(),
});

const adapter = new DatabaseCircuitBreakerAdapter({
    adapter: new MemoryCircuitBreakerStorageAdapter(),
});

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withCircuitBreakerLogging(logger));
