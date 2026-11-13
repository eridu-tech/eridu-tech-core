import { MemoryFileStorageAdapter } from "eridu-tech/file-storage/memory-file-storage-adapter";
import { withFileStorageLogging } from "eridu-tech/file-storage/plugins";
import { Log } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { withPlugin } from "eridu-tech/middleware";

const log = new Log({
    transport: new ConsoleLogTransport(),
});

const adapter = new MemoryFileStorageAdapter();

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withFileStorageLogging(log));
