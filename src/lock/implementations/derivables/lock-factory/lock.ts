/**
 * @module Lock
 */

import {
    FailedAcquireLockError,
    FailedReleaseLockError,
    FailedRefreshLockError,
    LOCK_STATE,
} from "@/lock/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { resolveLazyable } from "@/utilities/_module-exports.js";

import type {
    ILock,
    ILockAdapter,
    ILockState,
    ILockExpiredState,
    ILockAcquiredState,
    ILockUnavailableState,
} from "@/lock/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type {
    AsyncLazy,
    InternalSerdeIdentifiable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type ISerializedLock = {
    version: "1";
    key: string;
    lockId: string;
    ttlInMs: number | null;
};

/**
 * @internal
 */
export type LockSettings = {
    serializationId?: string;
    adapter: ILockAdapter;
    key: string;
    lockId: string;
    ttl: TimeSpan | null;
    defaultRefreshTime: TimeSpan;
};

/**
 * @internal
 */
export const LOCK_CLASS_TAG = Symbol("Lock");

/**
 * @internal
 */
export class Lock implements ILock, InternalSerdeIdentifiable {
    /**
     * @internal
     */
    static internalSerialize(deserializedValue: ILock): ISerializedLock {
        return {
            version: "1",
            key: deserializedValue.key,
            lockId: deserializedValue.id,
            ttlInMs: deserializedValue.ttl?.toMilliseconds() ?? null,
        };
    }

    private readonly adapter: ILockAdapter;
    private readonly internalKey: string;
    private readonly lockId: string;
    private internalTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serializationId: string;

    constructor(settings: LockSettings) {
        const {
            adapter,
            key,
            lockId,
            ttl,
            serializationId,
            defaultRefreshTime,
        } = settings;

        this.serializationId = serializationId ?? "";
        this.adapter = adapter;
        this.internalKey = key;
        this.lockId = lockId;
        this.internalTtl = ttl;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    internalClassTag(): symbol {
        return LOCK_CLASS_TAG;
    }

    internalSerializationId(): string {
        return this.serializationId;
    }

    async runOrFail<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        await this.acquireOrFail();
        try {
            return await resolveLazyable(asyncInvocable);
        } finally {
            await this.release();
        }
    }

    async acquire(): Promise<boolean> {
        return await this.adapter.acquire(
            this.internalKey,
            this.lockId,
            this.internalTtl?.toEndDate() ?? null,
        );
    }

    async acquireOrFail(): Promise<void> {
        const hasAcquired = await this.acquire();
        if (!hasAcquired) {
            throw FailedAcquireLockError.create(this.internalKey);
        }
    }

    async release(): Promise<boolean> {
        return await this.adapter.release(this.internalKey, this.lockId);
    }

    async releaseOrFail(): Promise<void> {
        const hasRelased = await this.release();
        if (!hasRelased) {
            throw FailedReleaseLockError.create(this.internalKey, this.lockId);
        }
    }

    async forceRelease(): Promise<boolean> {
        return await this.adapter.forceRelease(this.internalKey);
    }

    async refresh(ttl: ITimeSpan = this.defaultRefreshTime): Promise<boolean> {
        const hasRefreshed = await this.adapter.refresh(
            this.internalKey,
            this.lockId,
            TimeSpan.fromTimeSpan(ttl).toEndDate(),
        );
        if (hasRefreshed) {
            this.internalTtl = TimeSpan.fromTimeSpan(ttl);
        }
        return hasRefreshed;
    }

    async refreshOrFail(ttl?: ITimeSpan): Promise<void> {
        const hasRefreshed = await this.refresh(ttl);
        if (!hasRefreshed) {
            throw FailedRefreshLockError.create(this.internalKey, this.lockId);
        }
    }

    get key(): string {
        return this.internalKey;
    }

    get id(): string {
        return this.lockId;
    }

    get ttl(): TimeSpan | null {
        return this.internalTtl;
    }

    async getState(): Promise<ILockState> {
        const state = await this.adapter.getState(this.internalKey);
        if (state === null) {
            return {
                type: LOCK_STATE.EXPIRED,
            } satisfies ILockExpiredState;
        }
        if (state.owner === this.lockId) {
            return {
                type: LOCK_STATE.ACQUIRED,
                remainingTime:
                    state.expiration === null
                        ? null
                        : TimeSpan.fromDateRange({
                              start: new Date(),
                              end: state.expiration,
                          }),
            } satisfies ILockAcquiredState;
        }
        return {
            type: LOCK_STATE.UNAVAILABLE,
            owner: state.owner,
        } satisfies ILockUnavailableState;
    }
}
