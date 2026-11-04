/**
 * @module Cache
 */

import type {
    ICacheResolver,
    ICache,
} from "@/cache/contracts/_module-exports.js";
import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
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

    private getCache(): ICache<TType> {
        const cacheResolver = this.container.resolveOrFail(this.resolverToken);
        return cacheResolver.use(this.adapterName);
    }

    async exists(key: string): Promise<boolean> {
        return this.getCache().exists(key);
    }

    async missing(key: string): Promise<boolean> {
        return this.getCache().missing(key);
    }

    async get(key: string): Promise<TType | null> {
        return this.getCache().get(key);
    }

    async getOrFail(key: string): Promise<TType> {
        return this.getCache().getOrFail(key);
    }

    async getOr(
        key: string,
        defaultValue: AsyncLazyable<NoneFunc<TType>>,
    ): Promise<TType> {
        return this.getCache().getOr(key, defaultValue);
    }

    async getAndRemove(key: string): Promise<TType | null> {
        return this.getCache().getAndRemove(key);
    }

    async getOrAdd(
        key: string,
        valueToAdd: AsyncLazyable<TType>,
        ttl?: ITimeSpan | null,
    ): Promise<TType> {
        return this.getCache().getOrAdd(key, valueToAdd, ttl);
    }

    async add(key: string, value: TType, ttl?: ITimeSpan): Promise<boolean> {
        return this.getCache().add(key, value, ttl);
    }

    async addOrFail(key: string, value: TType, ttl?: ITimeSpan): Promise<void> {
        return this.getCache().addOrFail(key, value, ttl);
    }

    async put(key: string, value: TType, ttl?: ITimeSpan): Promise<boolean> {
        return this.getCache().put(key, value, ttl);
    }

    async update(key: string, value: TType): Promise<boolean> {
        return this.getCache().update(key, value);
    }

    async updateOrFail(key: string, value: TType): Promise<void> {
        return this.getCache().updateOrFail(key, value);
    }

    async increment(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<boolean> {
        return this.getCache().increment(key, value);
    }

    async incrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        return this.getCache().incrementOrFail(key, value);
    }

    async decrement(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<boolean> {
        return this.getCache().decrement(key, value);
    }

    async decrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        return this.getCache().decrementOrFail(key, value);
    }

    async remove(key: string): Promise<boolean> {
        return this.getCache().remove(key);
    }

    async removeOrFail(key: string): Promise<void> {
        return this.getCache().removeOrFail(key);
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        return this.getCache().removeMany(keys);
    }

    async clear(): Promise<void> {
        return this.getCache().clear();
    }
}
