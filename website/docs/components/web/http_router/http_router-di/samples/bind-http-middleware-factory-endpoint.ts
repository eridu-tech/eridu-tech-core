import { bindHttp, bindHttpMiddleware, router } from "./container.js";
import { requestLoggerToken } from "./middleware.js";
import { UsersController } from "./users-controller.js";

router.endpoint({
    url: "/users/:id",
    method: ["GET"],
    middlewares: (builder) =>
        builder.use(bindHttpMiddleware(requestLoggerToken)),
    handler: bindHttp(UsersController, "getUser"),
});
