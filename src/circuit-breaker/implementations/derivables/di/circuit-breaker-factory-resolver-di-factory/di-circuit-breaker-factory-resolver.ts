/**
 * @module CircuitBreaker
 */

import type {
    CircuitBreakerFactoryCreateSettings,
    ICircuitBreaker,
    ICircuitBreakerFactory,
    ICircuitBreakerFactoryResolver,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";

/**
 * @internal
 */
export class DiCircuitBreakerFactoryResolver<TAdapters extends string = string>
    implements ICircuitBreakerFactoryResolver<TAdapters>, ICircuitBreakerFactory
{
    private resolver: ICircuitBreakerFactoryResolver<TAdapters> | null = null;

    constructor(
        container: IContainer,
        resolverToken: DiToken<ICircuitBreakerFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ICircuitBreakerFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "DiCircuitBreakerFactoryResolver is not ready. Await IContainer.init() before use.",
            );
        }
        return this.resolver;
    }

    use(adapterName?: TAdapters): ICircuitBreakerFactory {
        return this.getResolver().use(adapterName);
    }

    create(
        key: string,
        settings?: CircuitBreakerFactoryCreateSettings,
    ): ICircuitBreaker {
        return this.use().create(key, settings);
    }
}
