/**
 * @module CircuitBreaker
 */

import { ProxyCircuitBreaker } from "@/circuit-breaker/implementations/derivables/di/proxy-circuit-breaker-factory-resolver/proxy-circuit-breaker.js";

import type {
    CircuitBreakerFactoryCreateSettings,
    ICircuitBreaker,
    ICircuitBreakerFactory,
    ICircuitBreakerFactoryResolver,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";

/**
 * @internal
 */
export class ProxyCircuitBreakerFactory<
    TAdapters extends string = string,
> implements ICircuitBreakerFactory {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ICircuitBreakerFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
    ) {}

    create(
        key: string,
        settings?: CircuitBreakerFactoryCreateSettings,
    ): ICircuitBreaker {
        return new ProxyCircuitBreaker(
            this.container,
            this.resolverToken,
            this.adapterName,
            key,
            settings,
        );
    }
}
