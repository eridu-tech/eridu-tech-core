/**
 * @module Cache
 */

import type { ICacheResolver } from "@/cache/contracts/cache-resolver.contract.js";
import type { ICache } from "@/cache/contracts/cache.contract.js";
import type {
    DiToken,
    IContainerHooks,
} from "@/di/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import type { AsyncLazyable } from "@/utilities/_module-exports.js";

/**
 * An {@link ICacheResolver} and {@link ICache} that resolve the underlying resolver
 * from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, after which `use()` and the
 * cache operations delegate to the real resolver. Construct the instance before
 * `init()`; calling `use()` or a cache operation before `init()` is awaited throws.
 *
 * @template TAdapters - Union type of the registered adapter names.
 * @template TType - The type of values cached.
 *
 * IMPORT_PATH: `"eridu-tech/cache/di"`
 * @group Derivables
 */
export class ProxyCacheResolver<
    TAdapters extends string = string,
    TType = unknown,
>
    implements ICache<TType>, ICacheResolver<TAdapters, TType>
{
    private resolver: ICacheResolver<TAdapters, TType> | null = null;

    constructor(
        container: Pick<IContainerHooks, "onInit">,
        resolverToken: DiToken<ICacheResolver<TAdapters, TType>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ICacheResolver<TAdapters, TType> {
        if (this.resolver === null) {
            throw new Error(
                "ProxyCacheResolver is not ready. Await IContainer.init() before use.",
            );
        }
        return this.resolver;
    }

    use(adapterName?: TAdapters): ICache<TType> {
        return this.getResolver().use(adapterName);
    }

    exists(key: string): Promise<boolean> {
        return this.use().exists(key);
    }

    missing(key: string): Promise<boolean> {
        return this.use().missing(key);
    }

    get(key: string): Promise<TType | null> {
        return this.use().get(key);
    }

    getOrFail(key: string): Promise<TType> {
        return this.use().getOrFail(key);
    }

    getOr(
        key: string,
        defaultValue: AsyncLazyable<
            Exclude<TType, (...args: Array<unknown>) => unknown>
        >,
    ): Promise<TType> {
        return this.use().getOr(key, defaultValue);
    }

    getAndRemove(key: string): Promise<TType | null> {
        return this.use().getAndRemove(key);
    }

    getOrAdd(
        key: string,
        valueToAdd: AsyncLazyable<TType>,
        ttl?: ITimeSpan | null,
    ): Promise<TType> {
        return this.use().getOrAdd(key, valueToAdd, ttl);
    }

    add(key: string, value: TType, ttl?: ITimeSpan): Promise<boolean> {
        return this.use().add(key, value, ttl);
    }

    addOrFail(key: string, value: TType, ttl?: ITimeSpan): Promise<void> {
        return this.use().addOrFail(key, value, ttl);
    }

    put(key: string, value: TType, ttl?: ITimeSpan): Promise<boolean> {
        return this.use().put(key, value, ttl);
    }

    update(key: string, value: TType): Promise<boolean> {
        return this.use().update(key, value);
    }

    updateOrFail(key: string, value: TType): Promise<void> {
        return this.use().updateOrFail(key, value);
    }

    increment(key: string, value?: Extract<TType, number>): Promise<boolean> {
        return this.use().increment(key, value);
    }

    incrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        return this.use().incrementOrFail(key, value);
    }

    decrement(key: string, value?: Extract<TType, number>): Promise<boolean> {
        return this.use().decrement(key, value);
    }

    decrementOrFail(
        key: string,
        value?: Extract<TType, number>,
    ): Promise<void> {
        return this.use().decrementOrFail(key, value);
    }

    remove(key: string): Promise<boolean> {
        return this.use().remove(key);
    }

    removeOrFail(key: string): Promise<void> {
        return this.use().removeOrFail(key);
    }

    removeMany(keys: Array<string>): Promise<boolean> {
        return this.use().removeMany(keys);
    }

    clear(): Promise<void> {
        return this.use().clear();
    }
}
