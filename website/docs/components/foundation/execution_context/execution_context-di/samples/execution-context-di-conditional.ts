import { contextToken } from "eridu-tech/execution-context/contracts";
import { executionContext } from "./execution-context-di.js";

type User = { id: string; name: string };

const userToken = contextToken<User>("user");

await executionContext.run(async () => {
    await executionContext.when(true, (context) =>
        context.put(userToken, { id: "123", name: "Alice" }),
    );
});
