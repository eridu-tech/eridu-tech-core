/**
 * @module SharedLock
 */

import type {
    DiToken,
    IContainerHooks,
} from "@/di/contracts/_module-exports.js";
import type {
    ISharedLock,
    ISharedLockFactory,
    ISharedLockFactoryResolver,
    SharedLockFactoryCreateSettings,
} from "@/shared-lock/contracts/_module-exports.js";

/**
 * An {@link ISharedLockFactoryResolver} and {@link ISharedLockFactory} that resolve the
 * underlying resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, after which `use()` and
 * `create()` delegate to the real resolver. Construct the instance before `init()`;
 * calling `use()` or `create()` before `init()` is awaited throws.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/di"`
 * @group Derivables
 */
export class ProxySharedLockFactoryResolver<TAdapters extends string = string>
    implements ISharedLockFactoryResolver<TAdapters>, ISharedLockFactory
{
    private resolver: ISharedLockFactoryResolver<TAdapters> | null = null;

    constructor(
        container: Pick<IContainerHooks, "onInit">,
        resolverToken: DiToken<ISharedLockFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ISharedLockFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "ProxySharedLockFactoryResolver is not ready. Await IContainer.init() before use.",
            );
        }
        return this.resolver;
    }

    use(adapterName?: TAdapters): ISharedLockFactory {
        return this.getResolver().use(adapterName);
    }

    create(
        key: string,
        settings: SharedLockFactoryCreateSettings,
    ): ISharedLock {
        return this.use().create(key, settings);
    }
}
