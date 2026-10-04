import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { bindHttpFactory } from "eridu-tech/http-router/di";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

export const container = new Container({ executionContext });

export const router = new HttpRouter({ router: defaultHttpRouterAdapter() });

export const bindHttp = bindHttpFactory(container);
