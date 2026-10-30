import { withCircuitBreakerFactory } from "eridu-tech/circuit-breaker/middlewares";
import { use } from "eridu-tech/middleware";
import { circuitBreakerFactoryResolver } from "./circuit-breaker.js";

const withCircuitBreaker = withCircuitBreakerFactory(
    circuitBreakerFactoryResolver,
);

const callExternalApi = async (endpoint: string): Promise<unknown> => {
    const response = await fetch(`https://api.example.com/${endpoint}`);
    return response.json();
};

// Wrap with circuit-breaker using the default adapter (`memory`)
const protectedCall = use(
    callExternalApi,
    withCircuitBreaker({
        key: ([endpoint]) => `api:${endpoint}`,
    }),
);

// Wrap with circuit-breaker using a specific adapter (`redis`)
const protectedCallOnRedis = use(
    callExternalApi,
    withCircuitBreaker.use("redis")({
        key: ([endpoint]) => `api:${endpoint}`,
    }),
);

await protectedCall("users"); // Succeeds or opens the circuit on repeated failures
await protectedCallOnRedis("users"); // Uses the Redis adapter
