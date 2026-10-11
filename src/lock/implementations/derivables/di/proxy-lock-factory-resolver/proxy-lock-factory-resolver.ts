/**
 * @module Lock
 */

import { v4 } from "uuid";

import { ProxyLockFactory } from "@/lock/implementations/derivables/di/proxy-lock-factory-resolver/proxy-lock-factory.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ILock,
    ILockFactory,
    ILockFactoryResolver,
    LockFactoryCreateSettings,
} from "@/lock/contracts/_module-exports.js";
import type { LockFactorySettingsBase } from "@/lock/implementations/derivables/_module-exports.js";

/**
 * Settings used to construct a {@link ProxyLockFactoryResolver}.
 *
 * The optional `defaultTtl` and `createLockId` settings mirror
 * {@link LockFactorySettingsBase} and fall back to the same defaults as
 * {@link LockFactory} when omitted.
 *
 * IMPORT_PATH: `"eridu-tech/lock/di"`
 * @group Derivables
 */
export type ProxyLockFactoryResolverSettings<
    TAdapters extends string = string,
> = Pick<LockFactorySettingsBase, "defaultTtl" | "createLockId"> & {
    container: Pick<IServiceResolver, "resolveOrFail">;
    resolverToken: DiToken<ILockFactoryResolver<TAdapters>>;
};

/**
 * An {@link ILockFactoryResolver} and {@link ILockFactory} that resolve the underlying
 * resolver from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyLockFactoryResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link ILockFactoryResolver}. Because resolution happens lazily, every
 * `LIFETIME` is supported:
 *
 * - `SINGLETON` and `TRANSIENT` registrations can be used once
 *   `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 *
 * `use()` returns a lightweight {@link ILockFactory} whose locks resolve the resolver
 * when one of their operations is invoked.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/lock/di"`
 * @group Derivables
 */
export class ProxyLockFactoryResolver<TAdapters extends string = string>
    implements ILockFactoryResolver<TAdapters>, ILockFactory
{
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<ILockFactoryResolver<TAdapters>>;
    private readonly settings: Required<
        Pick<LockFactorySettingsBase, "defaultTtl" | "createLockId">
    >;

    constructor(settings: ProxyLockFactoryResolverSettings) {
        const {
            container,
            resolverToken,
            createLockId = () => v4(),
            defaultTtl = TimeSpan.fromMinutes(5),
        } = settings;

        this.container = container;
        this.resolverToken = resolverToken;
        this.settings = {
            createLockId,
            defaultTtl,
        };
    }

    use(adapterName?: TAdapters): ILockFactory {
        return new ProxyLockFactory(
            this.container,
            this.resolverToken,
            adapterName,
            this.settings,
        );
    }

    create(key: string, settings?: LockFactoryCreateSettings): ILock {
        return this.use().create(key, settings);
    }
}
