/**
 * @module CircuitBreaker
 */

import type {
    CircuitBreakerFactoryCreateSettings,
    ICircuitBreaker,
    ICircuitBreakerFactory,
    ICircuitBreakerFactoryResolver,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type {
    DiToken,
    IContainerHooks,
} from "@/di/contracts/_module-exports.js";

/**
 * An {@link ICircuitBreakerFactoryResolver} and {@link ICircuitBreakerFactory} that
 * resolve the underlying resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, after which `use()` and
 * `create()` delegate to the real resolver. Construct the instance before `init()`;
 * calling `use()` or `create()` before `init()` is awaited throws.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/di"`
 * @group Derivables
 */
export class ProxyCircuitBreakerFactoryResolver<
    TAdapters extends string = string,
>
    implements ICircuitBreakerFactoryResolver<TAdapters>, ICircuitBreakerFactory
{
    private resolver: ICircuitBreakerFactoryResolver<TAdapters> | null = null;

    constructor(
        container: Pick<IContainerHooks, "onInit">,
        resolverToken: DiToken<ICircuitBreakerFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ICircuitBreakerFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "ProxyCircuitBreakerFactoryResolver is not ready. Await IContainer.init() before use.",
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
