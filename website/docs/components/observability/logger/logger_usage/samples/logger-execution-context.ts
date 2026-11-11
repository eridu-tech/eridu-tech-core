import { Logger } from "eridu-tech/logger";
import { ConsoleLoggerTransport } from "eridu-tech/logger/console-logger-transport";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";

export const executionContext = new ExecutionContext(
    new AlsExecutionContextAdapter(),
);

export const logger = new Logger({
    transport: new ConsoleLoggerTransport(),
    executionContext,
});

// Spans and metadata are carried through async boundaries
await executionContext.run(async () => {
    logger.scopedMetadata({ requestId: "req-1" }, async () => {
        await Promise.resolve();
        logger.span("db.query", () => {
            logger.info(["querying"]);
        });
    });
});
