import { AsyncExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";

// Create an async execution-context instance with an adapter
export const asyncExecutionContext = new AsyncExecutionContext(
    new AlsExecutionContextAdapter(),
);

const requestIdToken = contextToken<string>("requestId");

export async function handleRequest(): Promise<string | null> {
    return await asyncExecutionContext.run(async () => {
        // Mutating operations are awaitable
        await asyncExecutionContext.put(requestIdToken, "req-456");

        return await asyncExecutionContext.get(requestIdToken);
    });
}
