import { genericToken, LIFETIME } from "eridu-tech/di/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { ProxyExecutionContext } from "eridu-tech/execution-context/di";
import { container } from "./container.js";

import type { IExecutionContext } from "eridu-tech/execution-context/contracts";

type User = { id: string; name: string };

const userToken = contextToken<User>("user");
const executionContextToken =
    genericToken<IExecutionContext>("executionContext");

container.registerFactory({
    token: executionContextToken,
    factory: () => new ExecutionContext(new AlsExecutionContextAdapter()),
    deps: {},
    lifetime: LIFETIME.SCOPED,
});

const executionContext = new ProxyExecutionContext({
    container,
    executionContextToken,
});

await container.init();

// The scoped execution context is resolved per operation, so the proxy must be
// used inside container.run()
await container.run({
    scope: () => {
        executionContext.run(() => {
            executionContext.put(userToken, { id: "123", name: "Alice" });
        });
    },
});
