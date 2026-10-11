/**
 * @module SharedLock
 */

import { ProxySharedLock } from "@/shared-lock/implementations/derivables/di/proxy-shared-lock-factory-resolver/proxy-shared-lock.js";
import { callInvocable } from "@/utilities/_module-exports.js";

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
 * @internal
 */
export class ProxySharedLockFactory<
    TAdapters extends string = string,
> implements ISharedLockFactory {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ISharedLockFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly settings: Required<
            Pick<SharedLockFactorySettingsBase, "defaultTtl" | "createLockId">
        >,
    ) {}

    create(
        key: string,
        settings: SharedLockFactoryCreateSettings,
    ): ISharedLock {
        const {
            lockId = callInvocable(this.settings.createLockId),
            ttl = this.settings.defaultTtl,
            limit,
        } = settings;
        return new ProxySharedLock(
            this.container,
            this.resolverToken,
            this.adapterName,
            key,
            {
                lockId,
                ttl,
                limit,
            },
        );
    }
}
