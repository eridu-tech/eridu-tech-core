/**
 * @module RateLimiter
 */

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    IRateLimiter,
    IRateLimiterFactoryResolver,
    RateLimiterFactoryCreateSettings,
    RateLimiterState,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxyRateLimiter<
    TAdapters extends string = string,
> implements IRateLimiter {
    private rateLimiter: IRateLimiter | null = null;

    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            IRateLimiterFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly resourceKey: string,
        private readonly createSettings: RateLimiterFactoryCreateSettings,
    ) {}

    private async getRateLimiter(): Promise<IRateLimiter> {
        const factoryResolver = await this.container.resolveOrFail(
            this.resolverToken,
        );
        if (this.rateLimiter === null) {
            this.rateLimiter = factoryResolver
                .use(this.adapterName)
                .create(this.resourceKey, this.createSettings);
        }
        return this.rateLimiter;
    }

    get key(): string {
        return this.resourceKey;
    }

    get limit(): number {
        return this.createSettings.limit;
    }

    async getState(): Promise<RateLimiterState> {
        return (await this.getRateLimiter()).getState();
    }

    async runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return (await this.getRateLimiter()).runOrFail(asyncInvocable);
    }

    async reset(): Promise<void> {
        return (await this.getRateLimiter()).reset();
    }
}
