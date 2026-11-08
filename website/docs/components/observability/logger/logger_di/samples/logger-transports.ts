import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { NoOpLoggerTransport } from "eridu-tech/logger/no-op-logger-transport";

export const consoleLoggerTransport = new ConsoleLoggerTransport();
export const noOpLoggerTransport = new NoOpLoggerTransport();
