/**
 * @module Lock
 */

import type {
    DiToken,
    IContainerHooks,
} from "@/di/contracts/_module-exports.js";
import type {
    ILock,
    ILockFactory,
    ILockFactoryResolver,
    LockFactoryCreateSettings,
} from "@/lock/contracts/_module-exports.js";

/**
 * An {@link ILockFactoryResolver} and {@link ILockFactory} that resolve the underlying
 * resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, after which `use()` and
 * `create()` delegate to the real resolver. Construct the instance before `init()`;
 * calling `use()` or `create()` before `init()` is awaited throws.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/lock/di"`
 * @group Derivables
 */
export class ProxyLockFactoryResolver<TAdapters extends string = string>
    implements ILockFactoryResolver<TAdapters>, ILockFactory
{
    private resolver: ILockFactoryResolver<TAdapters> | null = null;

    constructor(
        container: Pick<IContainerHooks, "onInit">,
        resolverToken: DiToken<ILockFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ILockFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "ProxyLockFactoryResolver is not ready. Await IContainer.init() before use.",
            );
        }
        return this.resolver;
    }

    use(adapterName?: TAdapters): ILockFactory {
        return this.getResolver().use(adapterName);
    }

    create(key: string, settings?: LockFactoryCreateSettings): ILock {
        return this.use().create(key, settings);
    }
}
