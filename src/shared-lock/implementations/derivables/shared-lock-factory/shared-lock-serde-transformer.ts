/**
 * @module SharedLock
 */

import {
    SHARED_LOCK_CLASS_TAG,
    SharedLock,
} from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { isInternalSerdeIdentifiable } from "@/utilities/_module-exports.js";

import type { ISerdeTransformer } from "@/serde/contracts/_module-exports.js";
import type {
    ISharedLock,
    ISharedLockAdapter,
} from "@/shared-lock/contracts/_module-exports.js";
import type { ISerializedSharedLock } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type SharedLockSerdeTransformerSettings = {
    adapter: ISharedLockAdapter;
    defaultRefreshTime: TimeSpan;
    serializationId?: string;
};

/**
 * @internal
 */
export class SharedLockSerdeTransformer implements ISerdeTransformer<
    ISharedLock,
    ISerializedSharedLock
> {
    private readonly adapter: ISharedLockAdapter;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serializationId: string;

    constructor(settings: SharedLockSerdeTransformerSettings) {
        const { adapter, defaultRefreshTime, serializationId } = settings;

        this.serializationId = serializationId ?? "";
        this.adapter = adapter;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    get name(): OneOrMore<string> {
        return ["shared-lock", this.serializationId].filter(
            (str) => str !== "",
        );
    }

    async isApplicable(value: unknown): Promise<boolean> {
        if (!isInternalSerdeIdentifiable(value)) {
            return false;
        }
        if (value.internalClassTag() !== SHARED_LOCK_CLASS_TAG) {
            return false;
        }

        const isSerlizationIdMathcing =
            this.serializationId === (await value.internalSerializationId());

        return isSerlizationIdMathcing;
    }

    deserialize(serializedValue: ISerializedSharedLock): SharedLock {
        const { key, lockId, limit, ttlInMs } = serializedValue;
        return new SharedLock({
            lockId,
            adapter: this.adapter,
            key,
            limit,
            serializationId: this.serializationId,
            ttl: ttlInMs === null ? null : TimeSpan.fromMilliseconds(ttlInMs),
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }

    serialize(deserializedValue: SharedLock): ISerializedSharedLock {
        return SharedLock.internalSerialize(deserializedValue);
    }
}
