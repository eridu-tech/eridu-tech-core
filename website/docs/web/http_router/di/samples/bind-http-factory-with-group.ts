import { UsersController, bindHttp, router } from "./bind-http-factory.js";

router.group("/api", (api) => {
    api.endpoint({
        url: "/users/:id",
        method: ["GET"],
        handler: bindHttp(UsersController, "getUser"),
    });
});
