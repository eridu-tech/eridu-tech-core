/**
 * @module Semaphore
 */

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ISemaphore,
    ISemaphoreFactoryResolver,
    ISemaphoreState,
    SemaphoreFactoryCreateSettings,
} from "@/semaphore/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxySemaphore<
    TAdapters extends string = string,
> implements ISemaphore {
    private semaphore: ISemaphore | null = null;

    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ISemaphoreFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly resourceKey: string,
        private readonly createSettings: Required<SemaphoreFactoryCreateSettings>,
    ) {}

    private async getSemaphore(): Promise<ISemaphore> {
        const factoryResolver = await this.container.resolveOrFail(
            this.resolverToken,
        );
        if (this.semaphore === null) {
            this.semaphore = factoryResolver
                .use(this.adapterName)
                .create(this.resourceKey, this.createSettings);
        }
        return this.semaphore;
    }

    get key(): string {
        return this.resourceKey;
    }

    get id(): string {
        return this.createSettings.slotId;
    }

    get ttl(): TimeSpan | null {
        return this.createSettings.ttl === null
            ? null
            : TimeSpan.fromTimeSpan(this.createSettings.ttl);
    }

    async getState(): Promise<ISemaphoreState> {
        return (await this.getSemaphore()).getState();
    }

    async runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return (await this.getSemaphore()).runOrFail(asyncInvocable);
    }

    async acquire(): Promise<boolean> {
        return (await this.getSemaphore()).acquire();
    }

    async acquireOrFail(): Promise<void> {
        return (await this.getSemaphore()).acquireOrFail();
    }

    async release(): Promise<boolean> {
        return (await this.getSemaphore()).release();
    }

    async releaseOrFail(): Promise<void> {
        return (await this.getSemaphore()).releaseOrFail();
    }

    async forceReleaseAll(): Promise<boolean> {
        return (await this.getSemaphore()).forceReleaseAll();
    }

    async refresh(ttl?: ITimeSpan): Promise<boolean> {
        return (await this.getSemaphore()).refresh(ttl);
    }

    async refreshOrFail(ttl?: ITimeSpan): Promise<void> {
        return (await this.getSemaphore()).refreshOrFail(ttl);
    }
}
