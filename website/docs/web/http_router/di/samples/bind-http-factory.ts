import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import type { HttpHandlerFn } from "eridu-tech/http-router/contracts";
import { bindHttpFactory } from "eridu-tech/http-router/di";

export class UsersController {
    getUser: HttpHandlerFn = ({ req, text }) => {
        const { id } = req.params();
        return text(`User ${String(id)}`);
    };
}

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

container.registerValue({
    token: UsersController,
    value: new UsersController(),
});

export const router = new HttpRouter({ router: defaultHttpRouterAdapter() });

export const bindHttp = bindHttpFactory(container);

await container.init();
