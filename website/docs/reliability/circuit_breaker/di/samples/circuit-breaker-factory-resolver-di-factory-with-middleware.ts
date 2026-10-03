import { withCircuitBreakerFactory } from "eridu-tech/circuit-breaker/middlewares";
import { use } from "eridu-tech/middleware";
import { circuitBreakerFactory } from "./circuit-breaker-factory-resolver-di-factory.js";

const withCircuitBreaker = withCircuitBreakerFactory(circuitBreakerFactory);

const callExternalApi = async (endpoint: string): Promise<unknown> => {
    const response = await fetch(`https://api.example.com/${endpoint}`);
    return response.json();
};

const protectedCall = use(
    callExternalApi,
    withCircuitBreaker.use("storage2")({
        key: ([endpoint]) => `api:${endpoint}`,
    }),
);

await protectedCall("users");
