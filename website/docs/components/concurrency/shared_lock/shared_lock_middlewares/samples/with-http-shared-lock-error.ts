import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";
import { LimitReachedReaderSemaphoreError } from "eridu-tech/shared-lock/contracts";
import { withHttpSharedLockError } from "eridu-tech/shared-lock/middlewares";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter(),
});

router.use(withHttpSharedLockError());

router.endpoint({
    url: "/catalog/1",
    method: ["POST"],
    handler: async () => {
        // A 429 response when no reader slot is available
        throw LimitReachedReaderSemaphoreError.create("catalog");
    },
});
