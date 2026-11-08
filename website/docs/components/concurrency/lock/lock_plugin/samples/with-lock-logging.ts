import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { withLockLogging } from "eridu-tech/lock/plugins";
import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { withPlugin } from "eridu-tech/middleware";

const logger = new Logger({
    transport: new ConsoleLoggerTransport(),
});

const adapter = new MemoryLockAdapter();

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withLockLogging(logger));
