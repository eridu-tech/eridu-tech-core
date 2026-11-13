import { LogLayer, ConsoleTransport } from "loglayer";
import { LogLayerLogTransport } from "eridu-tech/log/loglayer-log-transport";

export const logLayerLogTransport = new LogLayerLogTransport({
    log: new LogLayer({
        transport: new ConsoleTransport({ log: console }),
    }),
});
