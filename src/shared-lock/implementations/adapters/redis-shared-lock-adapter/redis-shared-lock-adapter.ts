/**
 * @module SharedLock
 */

import { sharedLockFactoryLua } from "@/shared-lock/implementations/adapters/redis-shared-lock-adapter/lua/_module.js";
import { UnexpectedError } from "@/utilities/errors.js";

import type { Cluster, Redis, Result } from "ioredis";

import type {
    ISharedLockAdapter,
    ISharedLockAdapterState,
    SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module-exports.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
type IRedisJsonWriterLockState = {
    owner: string;

    /**
     * As unix timestamp in milliseconds. Omitted when the writer lock never expires.
     */
    expiration?: number;
};

/**
 * @internal
 */
type IRedisJsonReaderSemaphore = {
    limit: number;

    /**
     * Slot id mapped to its expiration as unix timestamp in milliseconds.
     * `null` means the slot never expires.
     */
    acquiredSlots: Record<string, number | null>;
};

/**
 * @internal
 */
type IRedisJsonSharedLockState = {
    writer?: IRedisJsonWriterLockState;
    reader?: IRedisJsonReaderSemaphore;
};

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        /**
         * @param writerKey Key of the writer lock
         * @param readerKey Key of the reader semaphore
         * @param readerLimitKey Key of the reader semaphore limit
         * @param expiration As unix timestamp in miliseconds, or `null` for an unexpireable lock
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_acquire_writer(
            writerKey: string,
            readerKey: string,
            readerLimitKey: string,
            lockId: string,
            expiration: number | null,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param writerKey Key of the writer lock
         * @param readerKey Key of the reader semaphore
         * @param readerLimitKey Key of the reader semaphore limit
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_release_writer(
            writerKey: string,
            readerKey: string,
            readerLimitKey: string,
            lockId: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param writerKey Key of the writer lock
         * @param readerKey Key of the reader semaphore
         * @param readerLimitKey Key of the reader semaphore limit
         * @param expiration As unix timestamp in miliseconds
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_refresh_writer(
            writerKey: string,
            readerKey: string,
            readerLimitKey: string,
            lockId: string,
            expiration: number,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param writerKey Key of the writer lock
         * @param readerKey Key of the reader semaphore
         * @param readerLimitKey Key of the reader semaphore limit
         * @param expiration As unix timestamp in miliseconds, or `null` for an unexpireable slot
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_acquire_reader(
            writerKey: string,
            readerKey: string,
            readerLimitKey: string,
            lockId: string,
            limit: number,
            expiration: number | null,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param writerKey Key of the writer lock
         * @param readerKey Key of the reader semaphore
         * @param readerLimitKey Key of the reader semaphore limit
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_release_reader(
            writerKey: string,
            readerKey: string,
            readerLimitKey: string,
            lockId: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param writerKey Key of the writer lock
         * @param readerKey Key of the reader semaphore
         * @param readerLimitKey Key of the reader semaphore limit
         * @param expiration As unix timestamp in miliseconds
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_refresh_reader(
            writerKey: string,
            readerKey: string,
            readerLimitKey: string,
            lockId: string,
            expiration: number,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param writerKey Key of the writer lock
         * @param readerKey Key of the reader semaphore
         * @param readerLimitKey Key of the reader semaphore limit
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_force_release(
            writerKey: string,
            readerKey: string,
            readerLimitKey: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param writerKey Key of the writer lock
         * @param readerKey Key of the reader semaphore
         * @param readerLimitKey Key of the reader semaphore limit
         * @param currentDate As unix timestamp in miliseconds
         * @returns {@link IRedisJsonSharedLockState | `IRedisJsonSharedLockState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_get_state(
            writerKey: string,
            readerKey: string,
            readerLimitKey: string,
            currentDate: number,
        ): Result<string, Context>;
    }
}

/**
 * To utilize the `RedisSharedLockAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package.
 *
 * Note in order to use `RedisSharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * Both a standalone `Redis` client and an ioredis `Cluster` client are supported.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/redis-shared-lock-adapter"`
 * @group Adapters
 */
export class RedisSharedLockAdapter implements ISharedLockAdapter, IInitizable {
    constructor(private readonly database: Redis | Cluster) {}

    /**
     * The keys share a hash tag so a cluster client routes all of them to the
     * same hash slot.
     */
    private static toRedisKeys(key: string): {
        writerKey: string;
        readerKey: string;
        readerLimitKey: string;
    } {
        const hashTag = `{${key}}`;
        return {
            writerKey: `${hashTag}__writer`,
            readerKey: `${hashTag}__reader`,
            readerLimitKey: `${hashTag}__reader__limit`,
        };
    }

    private initAcquireWriterCommand(): void {
        if (
            typeof this.database.eridu_shared_lock_acquire_writer === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_acquire_writer", {
            numberOfKeys: 3,
            lua: `
                ${sharedLockFactoryLua}

                local writerKey = KEYS[1];
                local readerKey = KEYS[2];
                local readerLimitKey = KEYS[3];
                local lockId = ARGV[1];
                local expiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.acquireWriter(writerKey, readerKey, readerLimitKey, lockId, expiration)
            `,
        });
    }

    private initReleaseWriterCommand(): void {
        if (
            typeof this.database.eridu_shared_lock_release_writer === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_release_writer", {
            numberOfKeys: 3,
            lua: `
                ${sharedLockFactoryLua}

                local writerKey = KEYS[1];
                local readerKey = KEYS[2];
                local readerLimitKey = KEYS[3];
                local lockId = ARGV[1];
                local currentDate = tonumber(ARGV[2]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.releaseWriter(writerKey, readerKey, readerLimitKey, lockId)
            `,
        });
    }

    private initRefreshWriterCommand(): void {
        if (
            typeof this.database.eridu_shared_lock_refresh_writer === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_refresh_writer", {
            numberOfKeys: 3,
            lua: `
                ${sharedLockFactoryLua}

                local writerKey = KEYS[1];
                local readerKey = KEYS[2];
                local readerLimitKey = KEYS[3];
                local lockId = ARGV[1];
                local expiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.refreshWriter(writerKey, readerKey, readerLimitKey, lockId, expiration)
            `,
        });
    }

    private initAcquireReaderCommand(): void {
        if (
            typeof this.database.eridu_shared_lock_acquire_reader === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_acquire_reader", {
            numberOfKeys: 3,
            lua: `
                ${sharedLockFactoryLua}

                local writerKey = KEYS[1];
                local readerKey = KEYS[2];
                local readerLimitKey = KEYS[3];
                local lockId = ARGV[1];
                local limit = tonumber(ARGV[2]);
                local expiration = tonumber(ARGV[3]);
                local currentDate = tonumber(ARGV[4]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.acquireReader(writerKey, readerKey, readerLimitKey, lockId, limit, expiration)
            `,
        });
    }

    private initReleaseReaderCommand(): void {
        if (
            typeof this.database.eridu_shared_lock_release_reader === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_release_reader", {
            numberOfKeys: 3,
            lua: `
                ${sharedLockFactoryLua}

                local writerKey = KEYS[1];
                local readerKey = KEYS[2];
                local readerLimitKey = KEYS[3];
                local lockId = ARGV[1];
                local currentDate = tonumber(ARGV[2]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.releaseReader(writerKey, readerKey, readerLimitKey, lockId)
            `,
        });
    }

    private initRefreshReaderCommand(): void {
        if (
            typeof this.database.eridu_shared_lock_refresh_reader === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_refresh_reader", {
            numberOfKeys: 3,
            lua: `
                ${sharedLockFactoryLua}

                local writerKey = KEYS[1];
                local readerKey = KEYS[2];
                local readerLimitKey = KEYS[3];
                local lockId = ARGV[1];
                local newExpiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.refreshReader(writerKey, readerKey, readerLimitKey, lockId, newExpiration)
            `,
        });
    }

    private initForceReleaseCommand(): void {
        if (
            typeof this.database.eridu_shared_lock_force_release === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_force_release", {
            numberOfKeys: 3,
            lua: `
                ${sharedLockFactoryLua}

                local writerKey = KEYS[1];
                local readerKey = KEYS[2];
                local readerLimitKey = KEYS[3];
                local currentDate = tonumber(ARGV[1]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.forceRelease(writerKey, readerKey, readerLimitKey)
            `,
        });
    }

    private initGetStateCommand(): void {
        if (typeof this.database.eridu_shared_lock_get_state === "function") {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_get_state", {
            numberOfKeys: 3,
            lua: `
                ${sharedLockFactoryLua}

                local writerKey = KEYS[1];
                local readerKey = KEYS[2];
                local readerLimitKey = KEYS[3];
                local currentDate = tonumber(ARGV[1]);

                local sharedLock = sharedLockFactory(currentDate)
                local state = sharedLock.getState(writerKey, readerKey, readerLimitKey)
                return cjson.encode(state)
            `,
        });
    }

    init(): void {
        this.initAcquireWriterCommand();
        this.initReleaseWriterCommand();
        this.initRefreshWriterCommand();
        this.initAcquireReaderCommand();
        this.initReleaseReaderCommand();
        this.initRefreshReaderCommand();
        this.initForceReleaseCommand();
        this.initGetStateCommand();
    }

    async acquireWriter(
        key: string,
        lockId: string,
        ttl: Date | null,
    ): Promise<boolean> {
        const { writerKey, readerKey, readerLimitKey } =
            RedisSharedLockAdapter.toRedisKeys(key);
        const result = await this.database.eridu_shared_lock_acquire_writer(
            writerKey,
            readerKey,
            readerLimitKey,
            lockId,
            ttl?.getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async releaseWriter(key: string, lockId: string): Promise<boolean> {
        const { writerKey, readerKey, readerLimitKey } =
            RedisSharedLockAdapter.toRedisKeys(key);
        const result = await this.database.eridu_shared_lock_release_writer(
            writerKey,
            readerKey,
            readerLimitKey,
            lockId,
            Date.now(),
        );
        return result === 1;
    }

    async refreshWriter(
        key: string,
        lockId: string,
        ttl: Date,
    ): Promise<boolean> {
        const { writerKey, readerKey, readerLimitKey } =
            RedisSharedLockAdapter.toRedisKeys(key);
        const result = await this.database.eridu_shared_lock_refresh_writer(
            writerKey,
            readerKey,
            readerLimitKey,
            lockId,
            ttl.getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const { key, lockId, limit, ttl } = settings;
        const { writerKey, readerKey, readerLimitKey } =
            RedisSharedLockAdapter.toRedisKeys(key);
        const result = await this.database.eridu_shared_lock_acquire_reader(
            writerKey,
            readerKey,
            readerLimitKey,
            lockId,
            limit,
            ttl?.getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async releaseReader(key: string, lockId: string): Promise<boolean> {
        const { writerKey, readerKey, readerLimitKey } =
            RedisSharedLockAdapter.toRedisKeys(key);
        const result = await this.database.eridu_shared_lock_release_reader(
            writerKey,
            readerKey,
            readerLimitKey,
            lockId,
            Date.now(),
        );
        return result === 1;
    }

    async refreshReader(
        key: string,
        lockId: string,
        ttl: Date,
    ): Promise<boolean> {
        const { writerKey, readerKey, readerLimitKey } =
            RedisSharedLockAdapter.toRedisKeys(key);
        const result = await this.database.eridu_shared_lock_refresh_reader(
            writerKey,
            readerKey,
            readerLimitKey,
            lockId,
            ttl.getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async forceRelease(key: string): Promise<boolean> {
        const { writerKey, readerKey, readerLimitKey } =
            RedisSharedLockAdapter.toRedisKeys(key);
        const result = await this.database.eridu_shared_lock_force_release(
            writerKey,
            readerKey,
            readerLimitKey,
            Date.now(),
        );
        return result === 1;
    }

    async getState(key: string): Promise<ISharedLockAdapterState | null> {
        const { writerKey, readerKey, readerLimitKey } =
            RedisSharedLockAdapter.toRedisKeys(key);
        const json = JSON.parse(
            await this.database.eridu_shared_lock_get_state(
                writerKey,
                readerKey,
                readerLimitKey,
                Date.now(),
            ),
        ) as IRedisJsonSharedLockState | null;
        if (json === null) {
            return null;
        }

        if (json.reader === undefined && json.writer !== undefined) {
            return {
                reader: null,
                writer: {
                    owner: json.writer.owner,
                    expiration:
                        json.writer.expiration === undefined
                            ? null
                            : new Date(json.writer.expiration),
                },
            };
        }

        if (json.writer === undefined && json.reader !== undefined) {
            return {
                writer: null,
                reader: {
                    limit: json.reader.limit,
                    acquiredSlots: new Map(
                        Object.entries(json.reader.acquiredSlots).map(
                            ([key_, expiration]) => {
                                if (expiration === null) {
                                    return [key_, null] as const;
                                }
                                return [key_, new Date(expiration)];
                            },
                        ),
                    ),
                },
            };
        }

        throw UnexpectedError.create(
            "Invalid ISharedLockAdapterState, expected either the reader field must be defined or the writer field must be defined, but not both.",
        );
    }
}
