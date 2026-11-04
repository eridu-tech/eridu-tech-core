/**
 * @module RateLimiter
 */

import { RATE_LIMITER_CLASS_TAG } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/rate-limiter.js";
import {
    isInternalSerdeIdentifiable,
    UnexpectedError,
} from "@/utilities/_module-exports.js";

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

    private getRateLimiter(): IRateLimiter {
        const factoryResolver = this.container.resolveOrFail(
            this.resolverToken,
        );
        if (this.rateLimiter === null) {
            this.rateLimiter = factoryResolver
                .use(this.adapterName)
                .create(this.resourceKey, this.createSettings);
        }
        return this.rateLimiter;
    }

    internalClassTag(): symbol {
        return RATE_LIMITER_CLASS_TAG;
    }

    internalSerializationId(): string {
        const rateLimiter = this.getRateLimiter();
        if (!isInternalSerdeIdentifiable(rateLimiter)) {
            throw UnexpectedError.create(
                "Cannot serialize the resolved rate limiter, it does not implement internal serialization",
            );
        }
        return rateLimiter.internalSerializationId();
    }

    get key(): string {
        return this.resourceKey;
    }

    get limit(): number {
        return this.createSettings.limit;
    }

    async getState(): Promise<RateLimiterState> {
        return this.getRateLimiter().getState();
    }

    async runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return this.getRateLimiter().runOrFail(asyncInvocable);
    }

    async reset(): Promise<void> {
        return this.getRateLimiter().reset();
    }
}
