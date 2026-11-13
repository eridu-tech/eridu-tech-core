import { bindHttp, bindHttpMiddleware, router } from "./container.js";
import { requestLogToken } from "./middleware.js";
import { UsersController } from "./users-controller.js";

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    middlewares: (builder) =>
        builder.use(bindHttpMiddleware(requestLogToken)),
    handler: bindHttp(UsersController, "getUser"),
});
