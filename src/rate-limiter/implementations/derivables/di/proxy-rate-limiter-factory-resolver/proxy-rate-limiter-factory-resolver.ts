/**
 * @module RateLimiter
 */

import type {
    DiToken,
    IContainerHooks,
} from "@/di/contracts/_module-exports.js";
import type {
    IRateLimiter,
    IRateLimiterFactory,
    IRateLimiterFactoryResolver,
    RateLimiterFactoryCreateSettings,
} from "@/rate-limiter/contracts/_module-exports.js";

/**
 * An {@link IRateLimiterFactoryResolver} and {@link IRateLimiterFactory} that resolve
 * the underlying resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, after which `use()` and
 * `create()` delegate to the real resolver. Construct the instance before `init()`;
 * calling `use()` or `create()` before `init()` is awaited throws.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/di"`
 * @group Derivables
 */
export class ProxyRateLimiterFactoryResolver<TAdapters extends string = string>
    implements IRateLimiterFactoryResolver<TAdapters>, IRateLimiterFactory
{
    private resolver: IRateLimiterFactoryResolver<TAdapters> | null = null;

    constructor(
        container: Pick<IContainerHooks, "onInit">,
        resolverToken: DiToken<IRateLimiterFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): IRateLimiterFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "ProxyRateLimiterFactoryResolver is not ready. Await IContainer.init() before use.",
            );
        }
        return this.resolver;
    }

    use(adapterName?: TAdapters): IRateLimiterFactory {
        return this.getResolver().use(adapterName);
    }

    create(
        key: string,
        settings: RateLimiterFactoryCreateSettings,
    ): IRateLimiter {
        return this.use().create(key, settings);
    }
}
