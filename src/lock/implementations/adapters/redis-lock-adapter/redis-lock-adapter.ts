/**
 * @module Lock
 */

import { lockFactoryLua } from "@/lock/implementations/adapters/redis-lock-adapter/lua/_module.js";

import type { Cluster, Result, Redis } from "ioredis";

import type {
    ILockAdapter,
    ILockAdapterState,
} from "@/lock/contracts/_module-exports.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
type IRedisJsonLockState = {
    owner: string;

    /**
     * As unix timestamp in milliseconds. Omitted when the lock never expires.
     */
    expiration?: number;
};

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        /**
         * @param key
         * @param lockId
         * @param expiration As unix timestamp in miliseconds, or `null` for an unexpireable lock
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_lock_acquire(
            key: string,
            lockId: string,
            expiration: number | null,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param key
         * @param lockId
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_lock_release(
            key: string,
            lockId: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param key
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_lock_force_release(
            key: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param key
         * @param lockId
         * @param expiration As unix timestamp in miliseconds
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_lock_refresh(
            key: string,
            lockId: string,
            expiration: number,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param key
         * @param currentDate As unix timestamp in miliseconds
         * @returns {string} {@link IRedisJsonLockState | `IRedisJsonLockState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_lock_get_state(
            key: string,
            currentDate: number,
        ): Result<string, Context>;
    }
}

/**
 * Configuration for `RedisLockAdapter`.
 * Requires a Redis client.
 *
 * IMPORT_PATH: `"eridu-tech/lock/redis-lock-adapter"`
 * @group Adapters
 */
export type RedisLockAdapterSettings = {
    /**
     * The Redis client instance for lock state operations.
     * Both a standalone `Redis` client and an ioredis `Cluster` client are supported.
     */
    database: Redis | Cluster;

    /**
     * Wraps the key in a Redis hash tag, e.g. `lock` becomes `{lock}`, so keys
     * with the same name land in the same hash slot across clusters. Set it to
     * `false` to use the key as is, e.g. when it already contains a hash tag.
     *
     * @default true
     */
    useShardingKey?: boolean;
};

/**
 * To utilize the `RedisLockAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package.
 *
 * Both a standalone `Redis` client and an ioredis `Cluster` client are supported.
 *
 * IMPORT_PATH: `"eridu-tech/lock/redis-lock-adapter"`
 * @group Adapters
 */
export class RedisLockAdapter implements ILockAdapter, IInitizable {
    private readonly database: Redis | Cluster;
    private readonly useShardingKey: boolean;

    constructor(settings: RedisLockAdapterSettings) {
        const { database, useShardingKey = true } = settings;
        this.database = database;
        this.useShardingKey = useShardingKey;
    }

    private initAcquireCommand(): void {
        if (typeof this.database.eridu_lock_acquire === "function") {
            return;
        }

        this.database.defineCommand("eridu_lock_acquire", {
            numberOfKeys: 1,
            lua: `
                ${lockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local expiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local lock = lockFactory(currentDate)
                return lock.acquire(key, lockId, expiration)
            `,
        });
    }

    private initReleaseCommand(): void {
        if (typeof this.database.eridu_lock_release === "function") {
            return;
        }

        this.database.defineCommand("eridu_lock_release", {
            numberOfKeys: 1,
            lua: `
                ${lockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local currentDate = tonumber(ARGV[2]);

                local lock = lockFactory(currentDate)
                return lock.release(key, lockId)
            `,
        });
    }

    private initForceReleaseCommand(): void {
        if (typeof this.database.eridu_lock_force_release === "function") {
            return;
        }

        this.database.defineCommand("eridu_lock_force_release", {
            numberOfKeys: 1,
            lua: `
                ${lockFactoryLua}

                local key = KEYS[1];
                local currentDate = tonumber(ARGV[1]);

                local lock = lockFactory(currentDate)
                return lock.forceRelease(key)
            `,
        });
    }

    private initRefreshCommand(): void {
        if (typeof this.database.eridu_lock_refresh === "function") {
            return;
        }

        this.database.defineCommand("eridu_lock_refresh", {
            numberOfKeys: 1,
            lua: `
                ${lockFactoryLua}

                local key = KEYS[1];
                local lockId = ARGV[1];
                local expiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local lock = lockFactory(currentDate)
                return lock.refresh(key, lockId, expiration)
            `,
        });
    }

    private initGetStateCommand(): void {
        if (typeof this.database.eridu_lock_get_state === "function") {
            return;
        }

        this.database.defineCommand("eridu_lock_get_state", {
            numberOfKeys: 1,
            lua: `
                ${lockFactoryLua}

                local key = KEYS[1];
                local currentDate = tonumber(ARGV[1]);

                local lock = lockFactory(currentDate)
                local state = lock.getState(key)
                return cjson.encode(state)
            `,
        });
    }

    init(): void {
        this.initAcquireCommand();
        this.initReleaseCommand();
        this.initForceReleaseCommand();
        this.initRefreshCommand();
        this.initGetStateCommand();
    }

    private shardingKey(key: string): string {
        if (this.useShardingKey) {
            return `{${key}}`;
        }
        return key;
    }

    async acquire(
        key: string,
        lockId: string,
        ttl: Date | null,
    ): Promise<boolean> {
        const result = await this.database.eridu_lock_acquire(
            this.shardingKey(key),
            lockId,
            ttl?.getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async release(key: string, lockId: string): Promise<boolean> {
        const result = await this.database.eridu_lock_release(
            this.shardingKey(key),
            lockId,
            Date.now(),
        );
        return result === 1;
    }

    async forceRelease(key: string): Promise<boolean> {
        const result = await this.database.eridu_lock_force_release(
            this.shardingKey(key),
            Date.now(),
        );
        return result === 1;
    }

    async refresh(key: string, lockId: string, ttl: Date): Promise<boolean> {
        const result = await this.database.eridu_lock_refresh(
            this.shardingKey(key),
            lockId,
            ttl.getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async getState(key: string): Promise<ILockAdapterState | null> {
        const json = JSON.parse(
            await this.database.eridu_lock_get_state(
                this.shardingKey(key),
                Date.now(),
            ),
        ) as IRedisJsonLockState | null;
        if (json === null) {
            return null;
        }
        return {
            owner: json.owner,
            expiration:
                json.expiration === undefined
                    ? null
                    : new Date(json.expiration),
        };
    }
}
