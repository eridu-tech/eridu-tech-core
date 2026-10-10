/**
 * @module Semaphore
 */

import {
    Semaphore,
    SEMAPHORE_CLASS_TAG,
} from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { isInternalSerdeIdentifiable } from "@/utilities/_module-exports.js";

import type {
    ISemaphore,
    ISemaphoreAdapter,
} from "@/semaphore/contracts/_module-exports.js";
import type { ISerializedSemaphore } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module-exports.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type SemaphoreSerdeTransformerSettings = {
    adapter: ISemaphoreAdapter;
    defaultRefreshTime: TimeSpan;
    serializationId?: string;
};

/**
 * @internal
 */
export class SemaphoreSerdeTransformer implements ISerdeTransformer<
    ISemaphore,
    ISerializedSemaphore
> {
    private readonly adapter: ISemaphoreAdapter;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serializationId: string;

    constructor(settings: SemaphoreSerdeTransformerSettings) {
        const { adapter, defaultRefreshTime, serializationId } = settings;

        this.serializationId = serializationId ?? "";
        this.adapter = adapter;
        this.defaultRefreshTime = defaultRefreshTime;
    }

    get name(): OneOrMore<string> {
        return ["semaphore", this.serializationId].filter((str) => str !== "");
    }

    async isApplicable(value: unknown): Promise<boolean> {
        if (!isInternalSerdeIdentifiable(value)) {
            return false;
        }
        if (value.internalClassTag() !== SEMAPHORE_CLASS_TAG) {
            return false;
        }

        const isSerlizationIdMathcing =
            this.serializationId === (await value.internalSerializationId());

        return isSerlizationIdMathcing;
    }

    deserialize(serializedValue: ISerializedSemaphore): Semaphore {
        const { key, slotId, limit, ttlInMs } = serializedValue;
        return new Semaphore({
            slotId,
            adapter: this.adapter,
            key,
            limit,
            serializationId: this.serializationId,
            ttl: ttlInMs === null ? null : TimeSpan.fromMilliseconds(ttlInMs),
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }

    serialize(deserializedValue: Semaphore): ISerializedSemaphore {
        return Semaphore.internalSerialize(deserializedValue);
    }
}
