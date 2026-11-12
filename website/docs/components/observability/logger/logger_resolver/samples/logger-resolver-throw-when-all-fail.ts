import { LoggerResolver } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { NoOpLoggerTransport } from "eridu-tech/logger/no-op-logger-transport";

export const loggerResolver = new LoggerResolver({
    transports: {
        console: new ConsoleLoggerTransport(),
        "no-op": new NoOpLoggerTransport(),
    },
    defaultTransport: ["console", "no-op"],
    // With `false` an `UnableToLogError` is thrown as soon as one transport
    // fails. The default (`true`) collects the failures and throws only when
    // every transport fails.
    throwWhenAllFail: false,
});

loggerResolver.init();
