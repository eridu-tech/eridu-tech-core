import { withSharedLockLogging } from "eridu-tech/shared-lock/plugins";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { withPlugin } from "eridu-tech/middleware";

const logger = new Logger({
    transport: new ConsoleLoggerTransport(),
});

const adapter = new MemorySharedLockAdapter();

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withSharedLockLogging(logger));
