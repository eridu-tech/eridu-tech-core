import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { NoOpLoggerTransport } from "eridu-tech/logger/no-op-logger-transport";

export const logger = new Logger({
    // One transport or an iterable of transports
    transport: [new ConsoleLoggerTransport(), new NoOpLoggerTransport()],
});

// Every entry reaches both transports
logger.info(["Written to the console and dropped by the no-op transport"]);
