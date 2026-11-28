/**
 * @module Lock
 */

import { lockFactoryLua } from "@/lock/implementations/adapters/redis-lock-adapter/lua/_module.js";

import type { Result, Redis } from "ioredis";

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
     * As unix timestamp in milliseconds. `0` means the lock never expires.
     */
    expiration: number;
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
 * To utilize the `RedisLockAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package.
 *
 * Note in order to use `RedisLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"eridu-tech/lock/redis-lock-adapter"`
 * @group Adapters
 */
export class RedisLockAdapter implements ILockAdapter, IInitizable {
    constructor(private readonly database: Redis) {}

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

    async acquire(
        key: string,
        lockId: string,
        ttl: Date | null,
    ): Promise<boolean> {
        const result = await this.database.eridu_lock_acquire(
            key,
            lockId,
            ttl?.getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async release(key: string, lockId: string): Promise<boolean> {
        const result = await this.database.eridu_lock_release(
            key,
            lockId,
            Date.now(),
        );
        return result === 1;
    }

    async forceRelease(key: string): Promise<boolean> {
        const result = await this.database.eridu_lock_force_release(
            key,
            Date.now(),
        );
        return result === 1;
    }

    async refresh(key: string, lockId: string, ttl: Date): Promise<boolean> {
        const result = await this.database.eridu_lock_refresh(
            key,
            lockId,
            ttl.getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async getState(key: string): Promise<ILockAdapterState | null> {
        const json = JSON.parse(
            await this.database.eridu_lock_get_state(key, Date.now()),
        ) as IRedisJsonLockState | null;
        if (json === null) {
            return null;
        }
        return {
            owner: json.owner,
            expiration:
                json.expiration === 0 ? null : new Date(json.expiration),
        };
    }
}
