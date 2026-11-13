import { withSharedLockLogging } from "eridu-tech/shared-lock/plugins";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
import { Log } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { withPlugin } from "eridu-tech/middleware";

const log = new Log({
    transport: new ConsoleLogTransport(),
});

const adapter = new MemorySharedLockAdapter();

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withSharedLockLogging(log));
