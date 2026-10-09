/**
 * @module Lock
 */

import { v4 } from "uuid";

import { LockSerdeTransformer } from "@/lock/implementations/derivables/lock-factory/lock-serde-transformer.js";
import { Lock } from "@/lock/implementations/derivables/lock-factory/lock.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import {
    CORE,
    resolveOneOrMore,
    resolveSerdeTransformerName,
    callInvocable,
} from "@/utilities/_module-exports.js";

import type {
    ILock,
    LockFactoryCreateSettings,
    ILockFactory,
    ILockAdapter,
} from "@/lock/contracts/_module-exports.js";
import type { ISerdeRegister } from "@/serde/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { OneOrMore, Invocable } from "@/utilities/_module-exports.js";

/**
 * Base configuration shared by all `LockFactory` variants.
 *
 * IMPORT_PATH: `"eridu-tech/lock"`
 * @group Derivables
 */
export type LockFactorySettingsBase = {
    /**
     * You can pass an {@link ISerdeRegister | `ISerderRegister`} instance to the {@link LockFactory | `LockFactory`} to register the lock's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
     *
     * new SuperJsonSerde()
     * ```
     */
    serde?: OneOrMore<ISerdeRegister>;

    /**
     * The registered serde transformer name used to identify lock serializer and deserializer adapters when there are adapters with the same name.
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
     * You can decide the default ttl value for {@link ILock | `ILock`} expiration. If null is passed then no ttl will be used by default.
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultTtl?: ITimeSpan | null;

    /**
     * The default refresh time used in the {@link ILock | `ILock`} `refresh` method.
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(5);
     * ```
     */
    defaultRefreshTime?: ITimeSpan;
};

/**
 * Configuration for `LockFactory`.
 * Extends {@link LockFactorySettingsBase | `LockFactorySettingsBase`} with a required adapter.
 *
 * IMPORT_PATH: `"eridu-tech/lock"`
 * @group Derivables
 */
export type LockFactorySettings = LockFactorySettingsBase & {
    /**
     * The underlying lock adapter that handles the actual locking operations.
     */
    adapter: ILockAdapter;
};

/**
 * `LockFactory` class can be derived from any {@link ILockAdapter | `ILockAdapter`}.
 *
 * Note the {@link ILock | `ILock`} instances created by the `LockFactory` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerdeRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerdeRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"eridu-tech/lock"`
 * @group Derivables
 */
export class LockFactory implements ILockFactory {
    private readonly adapter: ILockAdapter;
    private readonly creatLockId: Invocable<[], string>;
    private readonly defaultTtl: TimeSpan | null;
    private readonly defaultRefreshTime: TimeSpan;
    private readonly serde: OneOrMore<ISerdeRegister>;
    private readonly serdeTransformerName: string;

    constructor(settings: LockFactorySettings) {
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
        const transformer = new LockSerdeTransformer({
            adapter: this.adapter,
            defaultRefreshTime: this.defaultRefreshTime,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    create(key: string, settings: LockFactoryCreateSettings = {}): ILock {
        const {
            ttl = this.defaultTtl,
            lockId = callInvocable(this.creatLockId),
        } = settings;

        return new Lock({
            adapter: this.adapter,
            key,
            lockId,
            ttl: ttl === null ? null : TimeSpan.fromTimeSpan(ttl),
            serdeTransformerName: this.serdeTransformerName,
            defaultRefreshTime: this.defaultRefreshTime,
        });
    }
}
