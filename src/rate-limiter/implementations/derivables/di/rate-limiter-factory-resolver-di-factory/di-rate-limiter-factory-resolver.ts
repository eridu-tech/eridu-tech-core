/**
 * @module RateLimiter
 */

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type {
    IRateLimiter,
    IRateLimiterFactory,
    IRateLimiterFactoryResolver,
    RateLimiterFactoryCreateSettings,
} from "@/rate-limiter/contracts/_module-exports.js";

/**
 * @internal
 */
export class DiRateLimiterFactoryResolver<TAdapters extends string = string>
    implements IRateLimiterFactoryResolver<TAdapters>, IRateLimiterFactory
{
    private resolver: IRateLimiterFactoryResolver<TAdapters> | null = null;

    constructor(
        container: IContainer,
        resolverToken: DiToken<IRateLimiterFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): IRateLimiterFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "DiRateLimiterFactoryResolver is not ready. Await ready() before use.",
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
