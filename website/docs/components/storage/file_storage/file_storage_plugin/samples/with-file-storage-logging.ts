import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageLogging } from "eridu-tech/file-storage/plugins";
import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { withPlugin } from "eridu-tech/middleware";

const logger = new Logger({
    transport: new ConsoleLoggerTransport(),
});

const adapter = new MemoryFileStorageAdapter();

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withFileStorageLogging(logger));
