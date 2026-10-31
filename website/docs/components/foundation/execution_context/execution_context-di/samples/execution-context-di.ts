import { genericToken, LIFETIME } from "eridu-tech/di/contracts";
import { AsyncExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { ProxyExecutionContext } from "eridu-tech/execution-context/di";
import { container } from "./container.js";

import type { IAsyncExecutionContext } from "eridu-tech/execution-context/contracts";

const executionContextToken =
    genericToken<IAsyncExecutionContext>("executionContext");

container.registerFactory({
    token: executionContextToken,
    factory: () => new AsyncExecutionContext(new AlsExecutionContextAdapter()),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

// Create the proxy before container.init()
export const executionContext = new ProxyExecutionContext({
    container,
    executionContextToken,
});

await container.init();
