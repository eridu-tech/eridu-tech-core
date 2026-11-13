import { Log } from "eridu-tech/log";
import type { ILogTransport, LogData } from "eridu-tech/log/contracts";

export class InMemoryLogTransport implements ILogTransport {
    readonly entries: Array<LogData> = [];

    log(data: LogData): void {
        this.entries.push(data);
    }
}

export const log = new Log({
    transport: new InMemoryLogTransport(),
});
