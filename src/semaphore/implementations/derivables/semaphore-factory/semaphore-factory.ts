/**
 * @module Semaphore
 */

import { v4 } from "uuid";

import { SemaphoreSerdeTransformer } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore-serde-transformer.js";
import { Semaphore } from "@/semaphore/implementations/derivables/semaphore-factory/semaphore.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import {
    callInvocable,
    CORE,
    isPositiveNbr,
    resolveOneOrMore,
    resolveSerializationId,
} from "@/utilities/_module-exports.js";

import type {
    ISemaphore,
    ISemaphoreAdapter,
    SemaphoreFactoryCreateSettings,
    ISemaphoreFactory,
} from "@/semaphore/contracts/_module-exports.js";
import type { ISerdeRegister } from "@/serde/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable, OneOrMore } from "@/utilities/_module-exports.js";

/**
 * Base configuration shared by all `SemaphoreFactory` variants.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export type SemaphoreFactorySettingsBase = {
    /**
     * Optional prefix used to scope the serde transformer name for this semaphore factory.
     * This keeps multiple adapters with the same constructor name distinct.
     *
     * @default
     * ```ts
     * getConstructorName(adapter)
     * ```
     */
    serializationId?: string;

    /**
     * You can pass an {@link ISerdeRegister | `ISerderRegister`} instance to the {@link SemaphoreFactory | `SemaphoreFactory`} to register the semaphore's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
     *
     * new SuperJsonSerde()
     * ```
     */
    serde?: OneOrMore<ISerdeRegister>;

    /**
     * You can pass your slot id generator function.
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     */
    createSlotId?: Invocable<[], string>;

    /**
     * You can decide the default ttl value for {@link ISemaphore | `ISemaphore`} expiration. If null is passed then no ttl will be used by default.
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * The default refresh time used in the {@link ISemaphore | `ISemaphore`} `refresh` method.
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultRefreshTime?: ITimeSpan;
};

/**
 * Configuration for `SemaphoreFactory`.
 * Extends {@link SemaphoreFactorySettingsBase | `SemaphoreFactorySettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export type SemaphoreFactorySettings = SemaphoreFactorySettingsBase & {
    /**
     * The underlying semaphore adapter that handles the actual slot acquisition operations.
     */
    adapter: ISemaphoreAdapter;
};

/**
 * `SemaphoreFactory` class can be derived from any {@link ISemaphoreAdapter | `ISemaphoreAdapter`}.
 *
 * Note the {@link ISemaphore | `ISemaphore`} instances created by the `SemaphoreFactory` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerdeRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerdeRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export class SemaphoreFactory implements ISemaphoreFactory {
    private readonly adapter: ISemaphoreAdapter;
    private readonly defaultTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serde: OneOrMore<ISerdeRegister>;
    private readonly serializationId: string;
    private readonly createSlotId: Invocable<[], string>;

    constructor(settings: SemaphoreFactorySettings) {
        const {
            createSlotId = () => v4(),
            defaultTtl = TimeSpan.fromMinutes(5),
            defaultRefreshTime = TimeSpan.fromMinutes(5),
            serde = new SuperJsonSerde(),
            adapter,
            serializationId,
        } = settings;

        this.createSlotId = createSlotId;
        this.serde = serde;
        this.defaultRefreshTime = TimeSpan.fromTimeSpan(defaultRefreshTime);
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.serializationId = resolveSerializationId(serializationId, adapter);

        this.adapter = adapter;

        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new SemaphoreSerdeTransformer({
            adapter: this.adapter,
            defaultRefreshTime: this.defaultRefreshTime,
            serializationId: this.serializationId,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    create(key: string, settings: SemaphoreFactoryCreateSettings): ISemaphore {
        const {
            ttl = this.defaultTtl,
            limit,
            slotId = callInvocable(this.createSlotId),
        } = settings;
        isPositiveNbr(limit);

        return new Semaphore({
            slotId,
            limit,
            adapter: this.adapter,
            key,
            ttl: ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
            serializationId: this.serializationId,
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }
}
