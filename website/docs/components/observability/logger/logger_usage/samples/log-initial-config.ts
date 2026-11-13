import { Log } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";

export const log = new Log({
    transport: new ConsoleLogTransport(),
});

log.info(["Application started"]);
