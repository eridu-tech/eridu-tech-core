/**
 * @module Cache
 */

import { ProxyCache } from "@/cache/implementations/derivables/di/proxy-cache-resolver/proxy-cache.js";

import type { ICacheResolver } from "@/cache/contracts/cache-resolver.contract.js";
import type { ICache } from "@/cache/contracts/cache.contract.js";
import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import type { AsyncLazyable, NoneFunc } from "@/utilities/_module-exports.js";

/**
 * An {@link ICacheResolver} and {@link ICache} that resolve the underlying resolver
 * from a dependency-injection container.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link ICacheResolver}. Because resolution happens lazily, every
 * {@link LIFETIME} is supported:
 *
 * - `SINGLETON` and `TRANSIENT` registrations can be used once
 *   {@link IContainer.init} has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside {@link IContainer.run}; resolving it outside of a scope throws.
 *
 * `use()` returns a lightweight {@link ICache} that performs the same per-operation
 * resolution and forwards each cache method to the selected adapter.
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
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ICacheResolver<TAdapters, TType>
        >,
    ) {}

    use(adapterName?: TAdapters): ICache<TType> {
        return new ProxyCache(this.container, this.resolverToken, adapterName);
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
        defaultValue: AsyncLazyable<NoneFunc<TType>>,
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
