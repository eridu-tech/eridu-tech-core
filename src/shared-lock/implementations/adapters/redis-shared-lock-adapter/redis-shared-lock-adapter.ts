/**
 * @module SharedLock
 */

import { sharedLockFactoryLua } from "@/shared-lock/implementations/adapters/redis-shared-lock-adapter/lua/_module.js";
import { UnexpectedError } from "@/utilities/errors.js";

import type { Redis, Result } from "ioredis";

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
     * As unix timestamp in milliseconds. `0` means the writer lock never expires.
     */
    expiration: number;
};

/**
 * @internal
 */
type IRedisJsonReaderSemaphore = {
    limit: number;

    /**
     * Slot id mapped to its expiration as unix timestamp in milliseconds.
     * `0` means the slot never expires.
     */
    acquiredSlots: Record<string, number>;
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
         * @param expiration As unix timestamp in miliseconds, or `null` for an unexpireable lock
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_acquire_writer(
            key: string,
            lockId: string,
            expiration: number | null,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_release_writer(
            key: string,
            lockId: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param expiration As unix timestamp in miliseconds
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_refresh_writer(
            key: string,
            lockId: string,
            expiration: number,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param expiration As unix timestamp in miliseconds, or `null` for an unexpireable slot
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_acquire_reader(
            key: string,
            lockId: string,
            limit: number,
            expiration: number | null,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_release_reader(
            key: string,
            lockId: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param expiration As unix timestamp in miliseconds
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_refresh_reader(
            key: string,
            lockId: string,
            expiration: number,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_force_release(
            key: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param currentDate As unix timestamp in miliseconds
         * @returns {@link IRedisJsonSharedLockState | `IRedisJsonSharedLockState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_shared_lock_get_state(
            key: string,
            currentDate: number,
        ): Result<string, Context>;
    }
}

/**
 * To utilize the `RedisSharedLockAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package.
 *
 * Note in order to use `RedisSharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/redis-shared-lock-adapter"`
 * @group Adapters
 */
export class RedisSharedLockAdapter implements ISharedLockAdapter, IInitizable {
    constructor(private readonly database: Redis) {}

    private initAcquireWriterCommand(): void {
        if (
            typeof this.database.eridu_shared_lock_acquire_writer === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_acquire_writer", {
            numberOfKeys: 1,
            lua: `
                ${sharedLockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local expiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.acquireWriter(key, lockId, expiration)
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
            numberOfKeys: 1,
            lua: `
                ${sharedLockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local currentDate = tonumber(ARGV[2]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.releaseWriter(key, lockId)
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
            numberOfKeys: 1,
            lua: `
                ${sharedLockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local expiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.refreshWriter(key, lockId, expiration)
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
            numberOfKeys: 1,
            lua: `
                ${sharedLockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local limit = tonumber(ARGV[2]);
                local expiration = tonumber(ARGV[3]);
                local currentDate = tonumber(ARGV[4]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.acquireReader(key, lockId, limit, expiration)
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
            numberOfKeys: 1,
            lua: `
                ${sharedLockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local currentDate = tonumber(ARGV[2]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.releaseReader(key, lockId)
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
            numberOfKeys: 1,
            lua: `
                ${sharedLockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local newExpiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.refreshReader(key, lockId, newExpiration)
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
            numberOfKeys: 1,
            lua: `
                ${sharedLockFactoryLua}

                local key = KEYS[1];
                local currentDate = tonumber(ARGV[1]);

                local sharedLock = sharedLockFactory(currentDate)
                return sharedLock.forceRelease(key)
            `,
        });
    }

    private initGetStateCommand(): void {
        if (typeof this.database.eridu_shared_lock_get_state === "function") {
            return;
        }

        this.database.defineCommand("eridu_shared_lock_get_state", {
            numberOfKeys: 1,
            lua: `
                ${sharedLockFactoryLua}

                local key = KEYS[1];
                local currentDate = tonumber(ARGV[1]);

                local sharedLock = sharedLockFactory(currentDate)
                local state = sharedLock.getState(key)
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
        const result = await this.database.eridu_shared_lock_acquire_writer(
            key,
            lockId,
            ttl?.getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async releaseWriter(key: string, lockId: string): Promise<boolean> {
        const result = await this.database.eridu_shared_lock_release_writer(
            key,
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
        const result = await this.database.eridu_shared_lock_refresh_writer(
            key,
            lockId,
            ttl.getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const { key, lockId, limit, ttl } = settings;
        const result = await this.database.eridu_shared_lock_acquire_reader(
            key,
            lockId,
            limit,
            ttl?.getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async releaseReader(key: string, lockId: string): Promise<boolean> {
        const result = await this.database.eridu_shared_lock_release_reader(
            key,
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
        const result = await this.database.eridu_shared_lock_refresh_reader(
            key,
            lockId,
            ttl.getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async forceRelease(key: string): Promise<boolean> {
        const result = await this.database.eridu_shared_lock_force_release(
            key,
            Date.now(),
        );
        return result === 1;
    }

    async getState(key: string): Promise<ISharedLockAdapterState | null> {
        const json = JSON.parse(
            await this.database.eridu_shared_lock_get_state(key, Date.now()),
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
                        json.writer.expiration === 0
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
                                if (expiration === 0) {
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
