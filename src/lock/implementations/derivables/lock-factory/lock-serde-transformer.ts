/**
 * @module Lock
 */

import {
    Lock,
    LOCK_CLASS_TAG,
} from "@/lock/implementations/derivables/lock-factory/lock.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { isInternalSerdeIdentifiable } from "@/utilities/_module-exports.js";

import type { ILock, ILockAdapter } from "@/lock/contracts/_module-exports.js";
import type { ISerializedLock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module-exports.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type LockSerdeTransformerSettings = {
    adapter: ILockAdapter;
    defaultRefreshTime: TimeSpan;
    serializationId?: string;
};

/**
 * @internal
 */
export class LockSerdeTransformer implements ISerdeTransformer<
    ILock,
    ISerializedLock
> {
    private readonly adapter: ILockAdapter;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serializationId: string;

    constructor(settings: LockSerdeTransformerSettings) {
        const { adapter, defaultRefreshTime, serializationId } = settings;

        this.serializationId = serializationId ?? "";
        this.adapter = adapter;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    get name(): OneOrMore<string> {
        return ["lock", this.serializationId].filter((str) => str !== "");
    }

    async isApplicable(value: unknown): Promise<boolean> {
        if (!isInternalSerdeIdentifiable(value)) {
            return false;
        }
        if (value.internalClassTag() !== LOCK_CLASS_TAG) {
            return false;
        }

        const isSerlizationIdMathcing =
            this.serializationId === (await value.internalSerializationId());

        return isSerlizationIdMathcing;
    }

    deserialize(serializedValue: ISerializedLock): Lock {
        const { key, ttlInMs, lockId } = serializedValue;

        return new Lock({
            adapter: this.adapter,
            key,
            lockId,
            serializationId: this.serializationId,
            ttl: ttlInMs === null ? null : TimeSpan.fromMilliseconds(ttlInMs),
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }

    serialize(deserializedValue: Lock): ISerializedLock {
        return Lock.internalSerialize(deserializedValue);
    }
}
