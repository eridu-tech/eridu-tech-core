/**
 * @module SharedLock
 */

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type {
    ISharedLock,
    ISharedLockFactory,
    ISharedLockFactoryResolver,
    SharedLockFactoryCreateSettings,
} from "@/shared-lock/contracts/_module-exports.js";

/**
 * @internal
 */
export class DiSharedLockFactoryResolver<TAdapters extends string = string>
    implements ISharedLockFactoryResolver<TAdapters>, ISharedLockFactory
{
    private resolver: ISharedLockFactoryResolver<TAdapters> | null = null;

    constructor(
        container: IContainer,
        resolverToken: DiToken<ISharedLockFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ISharedLockFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "DiSharedLockFactoryResolver is not ready. Await ready() before use.",
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
