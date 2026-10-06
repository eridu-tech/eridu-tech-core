/**
 * @module Semaphore
 */

import { ProxySemaphore } from "@/semaphore/implementations/derivables/di/proxy-semaphore-factory-resolver/proxy-semaphore.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ISemaphore,
    ISemaphoreFactory,
    ISemaphoreFactoryResolver,
    SemaphoreFactoryCreateSettings,
} from "@/semaphore/contracts/_module-exports.js";
import type { SemaphoreFactorySettingsBase } from "@/semaphore/implementations/derivables/_module-exports.js";

/**
 * @internal
 */
export class ProxySemaphoreFactory<
    TAdapters extends string = string,
> implements ISemaphoreFactory {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ISemaphoreFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly settings: Required<
            Pick<SemaphoreFactorySettingsBase, "defaultTtl" | "createSlotId">
        >,
    ) {}

    create(key: string, settings: SemaphoreFactoryCreateSettings): ISemaphore {
        const {
            slotId = callInvocable(this.settings.createSlotId),
            ttl = this.settings.defaultTtl,
            limit,
        } = settings;
        return new ProxySemaphore(
            this.container,
            this.resolverToken,
            this.adapterName,
            key,
            {
                slotId,
                ttl,
                limit,
            },
        );
    }
}
