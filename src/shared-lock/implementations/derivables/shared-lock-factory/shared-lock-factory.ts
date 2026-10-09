/**
 * @module SharedLock
 */

import { v4 } from "uuid";

import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { SharedLockSerdeTransformer } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock-serde-transformer.js";
import { SharedLock } from "@/shared-lock/implementations/derivables/shared-lock-factory/shared-lock.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import {
    CORE,
    resolveOneOrMore,
    resolveSerdeTransformerName,
    callInvocable,
} from "@/utilities/_module-exports.js";

import type { ISerdeRegister } from "@/serde/contracts/_module-exports.js";
import type {
    ISharedLock,
    ISharedLockAdapter,
    SharedLockFactoryCreateSettings,
    ISharedLockFactory,
} from "@/shared-lock/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable, OneOrMore } from "@/utilities/_module-exports.js";

/**
 * Base configuration shared by all `SharedLockFactory` variants.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock"`
 * @group Derivables
 */
export type SharedLockFactorySettingsBase = {
    /**
     * You can pass an {@link ISerdeRegister | `ISerderRegister`} instance to the {@link SharedLockFactory | `SharedLockFactory`} to register the shared lock's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
     *
     * new SuperJsonSerde()
     * ```
     */
    serde?: OneOrMore<ISerdeRegister>;

    /**
     * The serde transformer name used to identify shared-lock serializer and deserializer adapters when there are adapters with the same name.
     *
     * The adapter's constructor name is appended to this value, or used on its own when omitted.
     * @default
     * ```ts
     * getConstructorName(adapter)
     * ```
     */
    serdeTransformerName?: string;

    /**
     * You can pass your own lock id generator function.
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     */
    createLockId?: Invocable<[], string>;

    /**
     * You can decide the default ttl value for {@link ISharedLock | `ISharedLock`} expiration. If null is passed then no ttl will be used by default.
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * The default refresh time used in the {@link ISharedLock | `ISharedLock`} `refresh` method.
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultRefreshTime?: ITimeSpan;
};

/**
 * Configuration for `SharedLockFactory`.
 * Extends {@link SharedLockFactorySettingsBase | `SharedLockFactorySettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock"`
 * @group Derivables
 */
export type SharedLockFactorySettings = SharedLockFactorySettingsBase & {
    /**
     * The underlying shared-lock adapter that handles the actual locking operations.
     */
    adapter: ISharedLockAdapter;
};

/**
 * `SharedLockFactory` class can be derived from any {@link ISharedLockAdapter | `ISharedLockAdapter`}.
 *
 * Note the {@link ISharedLock | `ISharedLock`} instances created by the `SharedLockFactory` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerdeRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerdeRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock"`
 * @group Derivables
 */
export class SharedLockFactory implements ISharedLockFactory {
    private readonly adapter: ISharedLockAdapter;
    private readonly creatLockId: Invocable<[], string>;
    private readonly defaultTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serde: OneOrMore<ISerdeRegister>;
    private readonly serdeTransformerName: string;

    constructor(settings: SharedLockFactorySettings) {
        const {
            defaultTtl = TimeSpan.fromMinutes(5),
            defaultRefreshTime = TimeSpan.fromMinutes(5),
            createLockId = () => v4(),
            serde = new SuperJsonSerde(),
            adapter,
            serdeTransformerName,
        } = settings;

        this.serde = serde;
        this.defaultRefreshTime = TimeSpan.fromTimeSpan(defaultRefreshTime);
        this.creatLockId = createLockId;
        this.defaultTtl =
            defaultTtl === null ? null : TimeSpan.fromTimeSpan(defaultTtl);
        this.serdeTransformerName = resolveSerdeTransformerName(
            serdeTransformerName,
            adapter,
        );

        this.adapter = adapter;
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new SharedLockSerdeTransformer({
            adapter: this.adapter,
            defaultRefreshTime: this.defaultRefreshTime,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    create(
        key: string,
        settings: SharedLockFactoryCreateSettings,
    ): ISharedLock {
        const {
            ttl = this.defaultTtl,
            lockId = callInvocable(this.creatLockId),
            limit,
        } = settings;

        return new SharedLock({
            limit,
            adapter: this.adapter,
            key,
            lockId,
            ttl: ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
            serdeTransformerName: this.serdeTransformerName,
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }
}
