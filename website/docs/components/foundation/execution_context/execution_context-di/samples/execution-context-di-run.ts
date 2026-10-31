import { contextToken } from "eridu-tech/execution-context/contracts";
import { executionContext } from "./execution-context-di.js";

const requestIdToken = contextToken<string>("requestId");

export async function handleRequest(): Promise<string | null> {
    return await executionContext.run(async () => {
        // Mutating operations are awaitable
        await executionContext.put(requestIdToken, "req-123");

        return await executionContext.get(requestIdToken);
    });
}
