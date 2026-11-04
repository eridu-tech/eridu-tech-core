import { OpenCircuitBreakerError } from "eridu-tech/circuit-breaker/contracts";
import { withHttpCircuitBreakerError } from "eridu-tech/circuit-breaker/middlewares";
import { HttpRouter, defaultHttpRouterAdapter } from "eridu-tech/http-router";

const router = new HttpRouter({
    router: defaultHttpRouterAdapter(),
});

router.use(withHttpCircuitBreakerError());

router.endpoint({
    url: "/payments/1",
    method: ["POST"],
    handler: async () => {
        // A 503 response when the circuit is open
        throw OpenCircuitBreakerError.create("payments");
    },
});
