import { router, bindHttp } from "./eridu/_module";
import { UserController } from "./2-controller";

router
    .endpoint({
        url: "/users/:id",
        method: "GET",
        handler: bindHttp(UserController, "get"),
    })
    .endpoint({
        url: "/users/:id",
        method: "DELETE",
        handler: bindHttp(UserController, "delete"),
    });
