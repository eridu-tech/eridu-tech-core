import { LogResolver } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { NoOpLogTransport } from "eridu-tech/log/no-op-log-transport";

export const logResolver = new LogResolver({
    transports: {
        // Each alias maps to one transport
        console: new ConsoleLogTransport(),
        "no-op": new NoOpLogTransport(),
    },
    // You can set an optional default transport, or a list of transports
    defaultTransport: "console",
});

logResolver.init();
