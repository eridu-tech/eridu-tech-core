/**
 * @module Semaphore
 */

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type {
    ISemaphore,
    ISemaphoreFactory,
    ISemaphoreFactoryResolver,
    SemaphoreFactoryCreateSettings,
} from "@/semaphore/contracts/_module-exports.js";

/**
 * @internal
 */
export class DiSemaphoreFactoryResolver<TAdapters extends string = string>
    implements ISemaphoreFactoryResolver<TAdapters>, ISemaphoreFactory
{
    private resolver: ISemaphoreFactoryResolver<TAdapters> | null = null;

    constructor(
        container: IContainer,
        resolverToken: DiToken<ISemaphoreFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ISemaphoreFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "DiSemaphoreFactoryResolver is not ready. Await ready() before use.",
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
