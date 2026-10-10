/**
 * @module Lock
 */

import { LOCK_CLASS_TAG } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { isInternalSerdeIdentifiable } from "@/utilities/_module-exports.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ILock,
    ILockFactoryResolver,
    ILockState,
    LockFactoryCreateSettings,
} from "@/lock/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxyLock<TAdapters extends string = string> implements ILock {
    private lock: ILock | null = null;

    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ILockFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly resourceKey: string,
        private readonly createSettings: Required<LockFactoryCreateSettings>,
    ) {}

    private async getLock(): Promise<ILock> {
        const factoryResolver = await this.container.resolveOrFail(
            this.resolverToken,
        );
        if (this.lock === null) {
            this.lock = factoryResolver
                .use(this.adapterName)
                .create(this.resourceKey, this.createSettings);
        }
        return this.lock;
    }

    internalClassTag(): symbol {
        return LOCK_CLASS_TAG;
    }

    async internalSerializationId(): Promise<string> {
        const lock = await this.getLock();
        if (!isInternalSerdeIdentifiable(lock)) {
            throw new Error("!!__MESSAGE__!!");
        }
        return await lock.internalSerializationId();
    }

    get key(): string {
        return this.resourceKey;
    }

    get id(): string {
        return this.createSettings.lockId;
    }

    get ttl(): TimeSpan | null {
        return this.createSettings.ttl === null
            ? null
            : TimeSpan.fromTimeSpan(this.createSettings.ttl);
    }

    async getState(): Promise<ILockState> {
        return (await this.getLock()).getState();
    }

    async runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return (await this.getLock()).runOrFail(asyncInvocable);
    }

    async acquire(): Promise<boolean> {
        return (await this.getLock()).acquire();
    }

    async acquireOrFail(): Promise<void> {
        return (await this.getLock()).acquireOrFail();
    }

    async release(): Promise<boolean> {
        return (await this.getLock()).release();
    }

    async releaseOrFail(): Promise<void> {
        return (await this.getLock()).releaseOrFail();
    }

    async forceRelease(): Promise<boolean> {
        return (await this.getLock()).forceRelease();
    }

    async refresh(ttl?: ITimeSpan): Promise<boolean> {
        return (await this.getLock()).refresh(ttl);
    }

    async refreshOrFail(ttl?: ITimeSpan): Promise<void> {
        return (await this.getLock()).refreshOrFail(ttl);
    }
}
