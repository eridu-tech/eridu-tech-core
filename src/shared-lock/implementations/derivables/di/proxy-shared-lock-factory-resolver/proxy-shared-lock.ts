/**
 * @module SharedLock
 */

import { SHARED_LOCK_CLASS_TAG } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import {
    isInternalSerdeIdentifiable,
    UnexpectedError,
} from "@/utilities/_module-exports.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ISharedLock,
    ISharedLockFactoryResolver,
    ISharedLockState,
    SharedLockFactoryCreateSettings,
} from "@/shared-lock/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/time-span.contract.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxySharedLock<
    TAdapters extends string = string,
> implements ISharedLock {
    private sharedLock: ISharedLock | null = null;

    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ISharedLockFactoryResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly resourceKey: string,
        private readonly createSettings: Required<SharedLockFactoryCreateSettings>,
    ) {}

    private getSharedLock(): ISharedLock {
        const factoryResolver = this.container.resolveOrFail(
            this.resolverToken,
        );
        if (this.sharedLock === null) {
            this.sharedLock = factoryResolver
                .use(this.adapterName)
                .create(this.resourceKey, this.createSettings);
        }
        return this.sharedLock;
    }

    internalClassTag(): symbol {
        return SHARED_LOCK_CLASS_TAG;
    }

    async internalSerializationId(): Promise<string> {
        const sharedLock = this.getSharedLock();
        if (!isInternalSerdeIdentifiable(sharedLock)) {
            throw UnexpectedError.create(
                "Cannot serialize the resolved shared lock, it does not implement internal serialization",
            );
        }
        return await sharedLock.internalSerializationId();
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

    get limit(): number {
        return this.createSettings.limit;
    }

    async getState(): Promise<ISharedLockState> {
        return this.getSharedLock().getState();
    }

    async runReaderOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return this.getSharedLock().runReaderOrFail(asyncInvocable);
    }

    async acquireReader(): Promise<boolean> {
        return this.getSharedLock().acquireReader();
    }

    async acquireReaderOrFail(): Promise<void> {
        return this.getSharedLock().acquireReaderOrFail();
    }

    async releaseReader(): Promise<boolean> {
        return this.getSharedLock().releaseReader();
    }

    async releaseReaderOrFail(): Promise<void> {
        return this.getSharedLock().releaseReaderOrFail();
    }

    async refreshReader(ttl?: ITimeSpan): Promise<boolean> {
        return this.getSharedLock().refreshReader(ttl);
    }

    async refreshReaderOrFail(ttl?: ITimeSpan): Promise<void> {
        return this.getSharedLock().refreshReaderOrFail(ttl);
    }

    async runWriterOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return this.getSharedLock().runWriterOrFail(asyncInvocable);
    }

    async acquireWriter(): Promise<boolean> {
        return this.getSharedLock().acquireWriter();
    }

    async acquireWriterOrFail(): Promise<void> {
        return this.getSharedLock().acquireWriterOrFail();
    }

    async releaseWriter(): Promise<boolean> {
        return this.getSharedLock().releaseWriter();
    }

    async releaseWriterOrFail(): Promise<void> {
        return this.getSharedLock().releaseWriterOrFail();
    }

    async refreshWriter(ttl?: ITimeSpan): Promise<boolean> {
        return this.getSharedLock().refreshWriter(ttl);
    }

    async refreshWriterOrFail(ttl?: ITimeSpan): Promise<void> {
        return this.getSharedLock().refreshWriterOrFail(ttl);
    }

    async forceRelease(): Promise<boolean> {
        return this.getSharedLock().forceRelease();
    }
}
