/**
 * @module Semaphore
 */

import type {
    DiToken,
    IContainerHooks,
} from "@/di/contracts/_module-exports.js";
import type {
    ISemaphore,
    ISemaphoreFactory,
    ISemaphoreFactoryResolver,
    SemaphoreFactoryCreateSettings,
} from "@/semaphore/contracts/_module-exports.js";

/**
 * An {@link ISemaphoreFactoryResolver} and {@link ISemaphoreFactory} that resolve the
 * underlying resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, after which `use()` and
 * `create()` delegate to the real resolver. Construct the instance before `init()`;
 * calling `use()` or `create()` before `init()` is awaited throws.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/di"`
 * @group Derivables
 */
export class ProxySemaphoreFactoryResolver<TAdapters extends string = string>
    implements ISemaphoreFactoryResolver<TAdapters>, ISemaphoreFactory
{
    private resolver: ISemaphoreFactoryResolver<TAdapters> | null = null;

    constructor(
        container: Pick<IContainerHooks, "onInit">,
        resolverToken: DiToken<ISemaphoreFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ISemaphoreFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "ProxySemaphoreFactoryResolver is not ready. Await IContainer.init() before use.",
            );
        }
        return this.resolver;
    }

    use(adapterName?: TAdapters): ISemaphoreFactory {
        return this.getResolver().use(adapterName);
    }

    create(key: string, settings: SemaphoreFactoryCreateSettings): ISemaphore {
        return this.use().create(key, settings);
    }
}
