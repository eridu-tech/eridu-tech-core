/**
 * @module Cache
 */

import type { ICacheResolver } from "@/cache/contracts/cache-resolver.contract.js";
import type { ICache } from "@/cache/contracts/cache.contract.js";
import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import type { AsyncLazyable, NoneFunc } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxyCache<
    TAdapters extends string = string,
    TType = unknown,
> implements ICache<TType> {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ICacheResolver<TAdapters, TType>
        >,
        private readonly adapterName: TAdapters | undefined,
    ) {}

    private async getCache(): Promise<ICache<TType>> {
        const cacheResolver = await this.container.resolveOrFail(
            this.resolverToken,
        );
        return cacheResolver.use(this.adapterName);
    }

    async exists(key: string): Promise<boolean> {
        return (await this.getCache()).exists(key);
    }

    async missing(key: string): Promise<boolean> {
        return (await this.getCache()).missing(key);
    }

    async get(key: string): Promise<TType | null> {
        return (await this.getCache()).get(key);
    }

    async getOrFail(key: string): Promise<TType> {
        return (await this.getCache()).getOrFail(key);
    }

    async getOr(
        key: string,
        defaultValue: AsyncLazyable<NoneFunc<TType>>,
    ): Promise<TType> {
        return (await this.getCache()).getOr(key, defaultValue);
    }

    async getAndRemove(key: string): Promise<TType | null> {
        return (await this.getCache()).getAndRemove(key);
    }

    async getOrAdd(
        key: string,
        valueToAdd: AsyncLazyable<TType>,
        ttl?: ITimeSpan | null,
    ): Promise<TType> {
        return (await this.getCache()).getOrAdd(key, valueToAdd, ttl);
    }

    async add(key: string, value: TType, ttl?: ITimeSpan): Promise<boolean> {
        return (await this.getCache()).add(key, value, ttl);
    }

    async addOrFail(key: string, value: TType, ttl?: ITimeSpan): Promise<void> {
        return (await this.getCache()).addOrFail(key, value, ttl);
    }

    async put(key: string, value: TType, ttl?: ITimeSpan): Promise<boolean> {
        return (await this.getCache()).put(key, value, ttl);
    }

    async update(key: string, value: TType): Promise<boolean> {
        return (await this.getCache()).update(key, value);
    }

    async updateOrFail(key: string, value: TType): Promise<void> {
        return (await this.getCache()).updateOrFail(key, value);
    }

    async increment(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<boolean> {
        return (await this.getCache()).increment(key, value);
    }

    async incrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        return (await this.getCache()).incrementOrFail(key, value);
    }

    async decrement(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<boolean> {
        return (await this.getCache()).decrement(key, value);
    }

    async decrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        return (await this.getCache()).decrementOrFail(key, value);
    }

    async remove(key: string): Promise<boolean> {
        return (await this.getCache()).remove(key);
    }

    async removeOrFail(key: string): Promise<void> {
        return (await this.getCache()).removeOrFail(key);
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        return (await this.getCache()).removeMany(keys);
    }

    async clear(): Promise<void> {
        return (await this.getCache()).clear();
    }
}
