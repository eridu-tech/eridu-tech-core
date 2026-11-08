import { Logger, LoggerResolver } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import type { ILoggerTransport, LogData } from "eridu-tech/logger/contracts";

class BufferedLoggerTransport implements ILoggerTransport {
    private readonly buffer: Array<LogData> = [];

    log(data: LogData): void {
        this.buffer.push(data);
    }

    flush(): Array<LogData> {
        return this.buffer.splice(0, this.buffer.length);
    }
}

const bufferedLoggerTransport = new BufferedLoggerTransport();

// A plain transport
export const logger = new Logger({ transport: bufferedLoggerTransport });

// ...or a named transport on a resolver, so it can be selected by alias
export const loggerResolver = new LoggerResolver<"console" | "buffered">({
    transports: {
        console: new ConsoleLoggerTransport(),
        buffered: bufferedLoggerTransport,
    },
    defaultTransport: "console",
});

loggerResolver.init();
