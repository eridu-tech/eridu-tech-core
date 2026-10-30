import { bindHttp, router } from "./container.js";
import { UsersController } from "./users-controller.js";

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    handler: bindHttp(UsersController, "getUser"),
});
