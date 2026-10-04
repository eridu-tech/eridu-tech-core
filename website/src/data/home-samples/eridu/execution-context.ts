import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { ExecutionContext } from "eridu-tech/execution-context";

export const executionContext = new ExecutionContext(new AlsExecutionContextAdapter())