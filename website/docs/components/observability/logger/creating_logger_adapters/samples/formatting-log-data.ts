import type { ILoggerTransport, LogData } from "eridu-tech/logger/contracts";
import { TimeSpan } from "eridu-tech/time-span";

export class JsonLineLoggerTransport implements ILoggerTransport {
    constructor(private readonly write: (line: string) => void) {}

    log(data: LogData): void {
        const spans: Record<string, number> = {};
        for (const [name, span] of Object.entries(data.spans)) {
            const timeSpan = span as TimeSpan | undefined;
            if (timeSpan !== undefined) {
                spans[name] = timeSpan.toMilliseconds();
            }
        }

        this.write(
            JSON.stringify({
                level: data.level,
                time: new Date(data.loggedAt).toISOString(),
                messages: data.messages,
                metadata: data.metadata,
                spans,
            }),
        );
    }
}
