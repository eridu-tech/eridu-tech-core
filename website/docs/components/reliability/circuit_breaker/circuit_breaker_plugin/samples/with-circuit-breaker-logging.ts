import { withCircuitBreakerLogging } from "eridu-tech/circuit-breaker/plugins";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { Log } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { withPlugin } from "eridu-tech/middleware";

const log = new Log({
    transport: new ConsoleLogTransport(),
});

const adapter = new DatabaseCircuitBreakerAdapter({
    adapter: new MemoryCircuitBreakerStorageAdapter(),
});

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withCircuitBreakerLogging(log));
