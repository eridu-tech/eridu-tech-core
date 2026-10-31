import { contextToken } from "eridu-tech/execution-context/contracts";
import { executionContext } from "./execution-context-di.js";

type User = { id: string; name: string };

const userToken = contextToken<User>("user");
const requestIdToken = contextToken<string>("requestId");

await executionContext.run(async () => {
    // A chain is a PromiseLike, so a group of mutations can be awaited
    await executionContext
        .put(userToken, { id: "123", name: "Alice" })
        .put(requestIdToken, "req-123");
});
