/**
 * @module CircuitBreaker
 */

import { withCircuitBreakerFactory } from "@/circuit-breaker/implementations/middlewares/with-circuit-breaker-factory/_module.js";

import type { ICircuitBreakerFactory } from "@/circuit-breaker/contracts/_module.js";
import type { WithCircuitBreakerSettings } from "@/circuit-breaker/implementations/middlewares/with-circuit-breaker-factory/_module.js";
import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
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
