import { Container } from "eridu-tech/di";
import { LIFETIME } from "eridu-tech/di/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import type { HttpHandlerFn } from "eridu-tech/http-router/contracts";
import { bindHttpFactory } from "eridu-tech/http-router/di";

class UsersService {
    private readonly users = new Map<string, { name: string }>([
        ["42", { name: "Ada" }],
    ]);

    getUser(id: string): { name: string } | null {
        return this.users.get(id) ?? null;
    }
}

class UsersController {
    constructor(private readonly usersService: UsersService) {}

    getUser: HttpHandlerFn = ({ req, json, notFound }) => {
        const { id } = req.params();
        const user = this.usersService.getUser(String(id));

        if (user === null) {
            return notFound();
        }

        return json(user);
    };
}

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

container.registerValue({
    token: UsersService,
    value: new UsersService(),
});

container.registerFactory({
    token: UsersController,
    deps: { usersService: UsersService },
    factory: (deps) => new UsersController(deps.usersService),
    lifetime: LIFETIME.SINGLETON,
});

export const router = new HttpRouter({ router: defaultHttpRouterAdapter() });
export const bindHttp = bindHttpFactory(container);

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: bindHttp(UsersController, "getUser"),
});

await container.init();
