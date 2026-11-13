import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { NoOpLogTransport } from "eridu-tech/log/no-op-log-transport";

export const consoleLogTransport = new ConsoleLogTransport();
export const noOpLogTransport = new NoOpLogTransport();
