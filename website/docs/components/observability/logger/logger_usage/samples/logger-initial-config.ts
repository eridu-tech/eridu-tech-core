import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";

export const logger = new Logger({
    transport: new ConsoleLoggerTransport(),
});

logger.info("Application started");
