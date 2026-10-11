/**
 * @module SharedLock
 */

import { v4 } from "uuid";

import { ProxySharedLockFactory } from "@/shared-lock/implementations/derivables/di/proxy-shared-lock-factory-resolver/proxy-shared-lock-factory.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ISharedLock,
    ISharedLockFactory,
    ISharedLockFactoryResolver,
    SharedLockFactoryCreateSettings,
} from "@/shared-lock/contracts/_module-exports.js";
import type { SharedLockFactorySettingsBase } from "@/shared-lock/implementations/derivables/_module-exports.js";

/**
 * Settings used to construct a {@link ProxySharedLockFactoryResolver}.
 *
 * The optional `defaultTtl` and `createLockId` settings mirror
 * {@link SharedLockFactorySettingsBase} and fall back to the same defaults as
 * {@link SharedLockFactory} when omitted.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/di"`
 * @group Derivables
 */
export type ProxySharedLockFactoryResolverSettings<
    TAdapters extends string = string,
> = Pick<SharedLockFactorySettingsBase, "defaultTtl" | "createLockId"> & {
    container: Pick<IServiceResolver, "resolveOrFail">;
    resolverToken: DiToken<ISharedLockFactoryResolver<TAdapters>>;
};

/**
 * An {@link ISharedLockFactoryResolver} and {@link ISharedLockFactory} that resolve the
 * underlying resolver from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxySharedLockFactoryResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link ISharedLockFactoryResolver}. Because resolution happens lazily, every
 * `LIFETIME` is supported:
 *
 * - `SINGLETON` and `TRANSIENT` registrations can be used once
 *   `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 *
 * `use()` returns a lightweight {@link ISharedLockFactory} whose shared locks resolve
 * the resolver when one of their operations is invoked.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/di"`
 * @group Derivables
 */
export class ProxySharedLockFactoryResolver<TAdapters extends string = string>
    implements ISharedLockFactoryResolver<TAdapters>, ISharedLockFactory
{
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<
        ISharedLockFactoryResolver<TAdapters>
    >;
    private readonly settings: Required<
        Pick<SharedLockFactorySettingsBase, "defaultTtl" | "createLockId">
    >;

    constructor(settings: ProxySharedLockFactoryResolverSettings) {
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

    use(adapterName?: TAdapters): ISharedLockFactory {
        return new ProxySharedLockFactory(
            this.container,
            this.resolverToken,
            adapterName,
            this.settings,
        );
    }

    create(
        key: string,
        settings: SharedLockFactoryCreateSettings,
    ): ISharedLock {
        return this.use().create(key, settings);
    }
}
