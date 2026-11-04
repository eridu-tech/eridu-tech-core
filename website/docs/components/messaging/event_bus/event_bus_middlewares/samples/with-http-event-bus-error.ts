import { UnableToDispatchEventBusError } from "eridu-tech/event-bus/contracts";
import { withHttpEventBusError } from "eridu-tech/event-bus/middlewares";
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter(),
});

router.use(withHttpEventBusError());

router.endpoint({
    url: "/users/1",
    method: ["POST"],
    handler: async () => {
        // A 503 response when the event bus adapter fails
        throw UnableToDispatchEventBusError.create("user.created");
    },
});
