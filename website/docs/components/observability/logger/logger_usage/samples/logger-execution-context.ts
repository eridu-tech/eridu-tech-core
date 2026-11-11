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

// Run scopes are carried through async boundaries
await executionContext.run(async () => {
    await logger.run(
        async () => {
            await Promise.resolve();
            logger.run(
                () => {
                    logger.info(["querying"]);
                },
                { span: "db.query" },
            );
        },
        { metadata: { requestId: "req-1" } },
    );
});
