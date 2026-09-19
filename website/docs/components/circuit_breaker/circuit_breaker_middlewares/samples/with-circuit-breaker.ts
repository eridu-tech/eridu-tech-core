import { withCircuitBreakerFactory } from "eridu-tech/circuit-breaker/middlewares";
import { use } from "eridu-tech/middleware";
import { circuitBreakerFactory } from "./circuit-breaker.js";

const withCircuitBreaker = withCircuitBreakerFactory(circuitBreakerFactory);

const callExternalApi = async (endpoint: string): Promise<unknown> => {
    const response = await fetch(`https://api.example.com/${endpoint}`);
    return response.json();
};

// Wrap with circuit-breaker
const protectedCall = use(
    callExternalApi,
    withCircuitBreaker({
        key: ([endpoint]) => `api:${endpoint}`,
    }),
);

await protectedCall("users"); // Succeeds or opens the circuit on repeated failures
