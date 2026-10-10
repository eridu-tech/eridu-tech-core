/**
 * @module SharedLock
 */

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

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

    private async getSharedLock(): Promise<ISharedLock> {
        const factoryResolver = await this.container.resolveOrFail(
            this.resolverToken,
        );
        if (this.sharedLock === null) {
            this.sharedLock = factoryResolver
                .use(this.adapterName)
                .create(this.resourceKey, this.createSettings);
        }
        return this.sharedLock;
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
        return this.limit;
    }

    async getState(): Promise<ISharedLockState> {
        return (await this.getSharedLock()).getState();
    }

    async runReaderOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return (await this.getSharedLock()).runReaderOrFail(asyncInvocable);
    }

    async acquireReader(): Promise<boolean> {
        return (await this.getSharedLock()).acquireReader();
    }

    async acquireReaderOrFail(): Promise<void> {
        return (await this.getSharedLock()).acquireReaderOrFail();
    }

    async releaseReader(): Promise<boolean> {
        return (await this.getSharedLock()).releaseReader();
    }

    async releaseReaderOrFail(): Promise<void> {
        return (await this.getSharedLock()).releaseReaderOrFail();
    }

    async refreshReader(ttl?: ITimeSpan): Promise<boolean> {
        return (await this.getSharedLock()).refreshReader(ttl);
    }

    async refreshReaderOrFail(ttl?: ITimeSpan): Promise<void> {
        return (await this.getSharedLock()).refreshReaderOrFail(ttl);
    }

    async runWriterOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return (await this.getSharedLock()).runWriterOrFail(asyncInvocable);
    }

    async acquireWriter(): Promise<boolean> {
        return (await this.getSharedLock()).acquireWriter();
    }

    async acquireWriterOrFail(): Promise<void> {
        return (await this.getSharedLock()).acquireWriterOrFail();
    }

    async releaseWriter(): Promise<boolean> {
        return (await this.getSharedLock()).releaseWriter();
    }

    async releaseWriterOrFail(): Promise<void> {
        return (await this.getSharedLock()).releaseWriterOrFail();
    }

    async refreshWriter(ttl?: ITimeSpan): Promise<boolean> {
        return (await this.getSharedLock()).refreshWriter(ttl);
    }

    async refreshWriterOrFail(ttl?: ITimeSpan): Promise<void> {
        return (await this.getSharedLock()).refreshWriterOrFail(ttl);
    }

    async forceRelease(): Promise<boolean> {
        return (await this.getSharedLock()).forceRelease();
    }
}
