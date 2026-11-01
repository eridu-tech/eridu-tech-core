import { FailedAcquireLockError } from "eridu-tech/lock/contracts";
import { withHttpLockError } from "eridu-tech/lock/middlewares";
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter(),
});

router.use(withHttpLockError());

router.endpoint({
    url: "/jobs/1",
    method: ["POST"],
    handler: async () => {
        // A 409 response when another caller owns the lock
        throw FailedAcquireLockError.create("job:1");
    },
});
