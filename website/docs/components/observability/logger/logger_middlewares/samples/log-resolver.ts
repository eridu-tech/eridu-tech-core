import { LogResolver } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { NoOpLogTransport } from "eridu-tech/log/no-op-log-transport";

export const logResolver = new LogResolver({
    transports: {
        console: new ConsoleLogTransport(),
        "no-op": new NoOpLogTransport(),
    },
    defaultTransport: "console",
});

logResolver.init();
