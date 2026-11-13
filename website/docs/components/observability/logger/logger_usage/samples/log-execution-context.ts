import { Log } from "eridu-tech/log";
import { ConsoleLogTransport } from "eridu-tech/log/console-log-transport";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";

export const executionContext = new ExecutionContext(
    new AlsExecutionContextAdapter(),
);

export const log = new Log({
    transport: new ConsoleLogTransport(),
    executionContext,
});

// Run scopes are carried through async boundaries
await executionContext.run(async () => {
    await log.run(
        async () => {
            await Promise.resolve();
            log.run(
                () => {
                    log.info(["querying"]);
                },
                { span: "db.query" },
            );
        },
        { metadata: { requestId: "req-1" } },
    );
});
