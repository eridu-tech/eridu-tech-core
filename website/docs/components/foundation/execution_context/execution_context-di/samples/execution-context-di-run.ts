import { contextToken } from "eridu-tech/execution-context/contracts";
import { executionContext } from "./execution-context-di.js";

const requestIdToken = contextToken<string>("requestId");

export function handleRequest(): string | null {
    return executionContext.run(() => {
        executionContext.put(requestIdToken, "req-123");

        return executionContext.get(requestIdToken);
    });
}
