import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { withLockLogging } from "eridu-tech/lock/plugins";
import { Log } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { withPlugin } from "eridu-tech/middleware";

const log = new Log({
    transport: new ConsoleLogTransport(),
});

const adapter = new MemoryLockAdapter();

// Every adapter call is logged with its arguments and its outcome
const loggedAdapter = withPlugin(adapter, withLockLogging(log));
