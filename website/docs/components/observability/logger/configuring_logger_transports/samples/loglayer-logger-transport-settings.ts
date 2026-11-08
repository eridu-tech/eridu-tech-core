import { LogLayer, ConsoleTransport } from "loglayer";
import { LogLayerLoggerTransport } from "eridu-tech/logger/loglayer-logger-transport";

export const logLayerLoggerTransport = new LogLayerLoggerTransport({
    logger: new LogLayer({
        transport: new ConsoleTransport({ logger: console }),
    }),
    // Opt out of attaching the entry timestamp to the metadata
    includeLoggedAt: false,
});
