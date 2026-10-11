import { bindHttp, router } from "./container.js";
import { UsersController } from "./users-controller.js";

router.group("/api", (api) => {
    api.endpoint({
        url: "/users/:id",
        method: ["GET"],
        handler: bindHttp(UsersController, "getUser"),
    });
});
