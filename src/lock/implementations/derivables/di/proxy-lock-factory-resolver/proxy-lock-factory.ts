/**
 * @module Lock
 */

import { ProxyLock } from "@/lock/implementations/derivables/di/proxy-lock-factory-resolver/proxy-lock.js";
import { callInvocable } from "@/utilities/_module-exports.js";

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
 * @internal
 */
export class ProxyLockFactory<
    TAdapters extends string = string,
> implements ILockFactory {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ILockFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly settings: Required<
            Pick<LockFactorySettingsBase, "defaultTtl" | "createLockId">
        >,
    ) {}

    create(key: string, settings: LockFactoryCreateSettings = {}): ILock {
        const {
            lockId = callInvocable(this.settings.createLockId),
            ttl = this.settings.defaultTtl,
        } = settings;
        return new ProxyLock(
            this.container,
            this.resolverToken,
            this.adapterName,
            key,
            {
                lockId,
                ttl,
            },
        );
    }
}
