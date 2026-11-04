import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { LimitReachedSemaphoreError } from "eridu-tech/semaphore/contracts";
import { withHttpSemaphoreError } from "eridu-tech/semaphore/middlewares";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter(),
});

router.use(withHttpSemaphoreError());

router.endpoint({
    url: "/workers/1",
    method: ["POST"],
    handler: async () => {
        // A 429 response when no semaphore slot is available
        throw LimitReachedSemaphoreError.create("workers");
    },
});
