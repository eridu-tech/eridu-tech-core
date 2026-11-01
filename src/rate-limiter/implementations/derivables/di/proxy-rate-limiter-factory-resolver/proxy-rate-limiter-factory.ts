/**
 * @module RateLimiter
 */

import { ProxyRateLimiter } from "@/rate-limiter/implementations/derivables/di/proxy-rate-limiter-factory-resolver/proxy-rate-limiter.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    IRateLimiter,
    IRateLimiterFactory,
    IRateLimiterFactoryResolver,
    RateLimiterFactoryCreateSettings,
} from "@/rate-limiter/contracts/_module-exports.js";

/**
 * @internal
 */
export class ProxyRateLimiterFactory<
    TAdapters extends string = string,
> implements IRateLimiterFactory {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            IRateLimiterFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
    ) {}

    create(
        key: string,
        settings: RateLimiterFactoryCreateSettings,
    ): IRateLimiter {
        return new ProxyRateLimiter(
            this.container,
            this.resolverToken,
            this.adapterName,
            key,
            settings,
        );
    }
}
