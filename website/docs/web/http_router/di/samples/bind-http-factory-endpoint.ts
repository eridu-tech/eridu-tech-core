import { UsersController, bindHttp, router } from "./bind-http-factory.js";

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: bindHttp(UsersController, "getUser"),
});
