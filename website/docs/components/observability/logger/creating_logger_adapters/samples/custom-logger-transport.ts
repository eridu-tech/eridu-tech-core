import { Logger } from "eridu-tech/logger";
import type { ILoggerTransport, LogData } from "eridu-tech/logger/contracts";

export class InMemoryLoggerTransport implements ILoggerTransport {
    readonly entries: Array<LogData> = [];

    log(data: LogData): void {
        this.entries.push(data);
    }
}

export const logger = new Logger({
    transport: new InMemoryLoggerTransport(),
});
