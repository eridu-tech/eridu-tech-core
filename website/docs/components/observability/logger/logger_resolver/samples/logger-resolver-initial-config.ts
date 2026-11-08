import { LoggerResolver } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { NoOpLoggerTransport } from "eridu-tech/logger/no-op-logger-transport";

export const loggerResolver = new LoggerResolver({
    transports: {
        // Each alias maps to one transport or an iterable of transports
        console: new ConsoleLoggerTransport(),
        "no-op": new NoOpLoggerTransport(),
    },
    // You can set an optional default transport
    defaultTransport: "console",
});

loggerResolver.init();
