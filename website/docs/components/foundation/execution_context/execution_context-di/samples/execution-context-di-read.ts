import { contextToken } from "eridu-tech/execution-context/contracts";
import { executionContext } from "./execution-context-di.js";

type User = { id: string; name: string };

const userToken = contextToken<User>("user");
const userIdToken = contextToken<string>("userId");

await executionContext.run(async () => {
    await executionContext.put(userToken, { id: "123", name: "Alice" });

    // { id: "123", name: "Alice" }
    const user = await executionContext.get(userToken);
    // true
    const hasUser = await executionContext.exists(userToken);
    // false
    const hasUserId = await executionContext.exists(userIdToken);
    // "anonymous"
    const userId = await executionContext.getOr(userIdToken, "anonymous");
    // Throws NotFoundExecutionContextError when the token is missing
    const userOrFail = await executionContext.getOrFail(userToken);

    console.log("user:", user);
    console.log("has user:", hasUser);
    console.log("has user id:", hasUserId);
    console.log("user id:", userId);
    console.log("user or fail:", userOrFail);
});
