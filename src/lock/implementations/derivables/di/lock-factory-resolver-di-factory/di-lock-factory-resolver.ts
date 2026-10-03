/**
 * @module Lock
 */

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type {
    ILock,
    ILockFactory,
    ILockFactoryResolver,
    LockFactoryCreateSettings,
} from "@/lock/contracts/_module-exports.js";

/**
 * @internal
 */
export class DiLockFactoryResolver<TAdapters extends string = string>
    implements ILockFactoryResolver<TAdapters>, ILockFactory
{
    private resolver: ILockFactoryResolver<TAdapters> | null = null;

    constructor(
        container: IContainer,
        resolverToken: DiToken<ILockFactoryResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ILockFactoryResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "DiLockFactoryResolver is not ready. Await ready() before use.",
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
