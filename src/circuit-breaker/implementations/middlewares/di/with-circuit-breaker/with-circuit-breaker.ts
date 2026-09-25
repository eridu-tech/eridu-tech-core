/**
 * @module CircuitBreaker
 */

import { withCircuitBreakerFactory } from "@/circuit-breaker/implementations/middlewares/with-circuit-breaker-factory/_module.js";

import type { ICircuitBreakerFactory } from "@/circuit-breaker/contracts/_module.js";
import type { WithCircuitBreakerSettings } from "@/circuit-breaker/implementations/middlewares/with-circuit-breaker-factory/_module.js";
import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a circuit-breaker middleware that resolves its
 * {@link ICircuitBreakerFactory} from a dependency-injection container.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withCircuitBreakerFactory}.
 *
 * @param container - The container the circuit-breaker factory is resolved from.
 * @param circuitBreakerFactoryToken - The token the circuit-breaker factory is
 *        registered under.
 * @returns A function that accepts {@link WithCircuitBreakerSettings} and returns
 *          a middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/middlewares/di"`
 * @group Middlewares
 */
export function registerWithCircuitBreaker(
    container: IContainer,
    circuitBreakerFactoryToken: DiToken<ICircuitBreakerFactory>,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithCircuitBreakerSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const circuitBreakerFactory = await container.resolveOrFail(
                circuitBreakerFactoryToken,
            );
            const withCircuitBreaker = withCircuitBreakerFactory(
                circuitBreakerFactory,
            );
            const middleware = withCircuitBreaker<TParameters, TReturn>(
                settings,
            );
            return middleware(args);
        };
    };
}
