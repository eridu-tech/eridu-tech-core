/**
 * @module Semaphore
 */

import { semaphoreFactoryLua } from "@/semaphore/implementations/adapters/redis-semaphore-adapter/lua/_module.js";

import type { Cluster, Redis, Result } from "ioredis";

import type {
    ISemaphoreAdapter,
    ISemaphoreAdapterState,
    SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module-exports.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
type IRedisJsonSemaphoreState = {
    limit: number;

    /**
     * Slot id mapped to its expiration as unix timestamp in milliseconds.
     * `null` means the slot never expires.
     */
    acquiredSlots: Record<string, number | null>;
};

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        /**
         * @param limitKey Key of the semaphore limit
         * @param expiration As unix timestamp in miliseconds, or `null` for an unexpireable slot
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_acquire(
            key: string,
            limitKey: string,
            slotId: string,
            limit: number,
            expiration: number | null,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param limitKey Key of the semaphore limit
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_release(
            key: string,
            limitKey: string,
            slotId: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param limitKey Key of the semaphore limit
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_force_release_all(
            key: string,
            limitKey: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param limitKey Key of the semaphore limit
         * @param newExpiration As unix timestamp in miliseconds
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_refresh(
            key: string,
            limitKey: string,
            slotId: string,
            newExpiration: number,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param limitKey Key of the semaphore limit
         * @param currentDate As unix timestamp in miliseconds
         * @returns {@link IRedisJsonSemaphoreState | `IRedisJsonSemaphoreState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_get_state(
            key: string,
            limitKey: string,
            currentDate: number,
        ): Result<string, Context>;
    }
}

// acquiredSlots: Map<string, Date | null>;

/**
 * Configuration for `RedisSemaphoreAdapter`.
 * Requires a Redis client.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/redis-semaphore-adapter"`
 * @group Adapters
 */
export type RedisSemaphoreAdapterSettings = {
    /**
     * The Redis client instance for semaphore state operations.
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
 * @internal
 */
type SemaphoreKeys = {
    slotKey: string;
    limitKey: string;
};

/**
 * To utilize the `RedisSemaphoreAdapter`, you must install the `"ioredis"` package.
 *
 * Both a standalone `Redis` client and an ioredis `Cluster` client are supported.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/redis-semaphore-adapter"`
 * @group Adapters
 */
export class RedisSemaphoreAdapter implements ISemaphoreAdapter, IInitizable {
    private readonly database: Redis | Cluster;
    private readonly useShardingKey: boolean;

    constructor(settings: RedisSemaphoreAdapterSettings) {
        const { database, useShardingKey = true } = settings;
        this.database = database;
        this.useShardingKey = useShardingKey;
    }

    private initAcquireCommand(): void {
        if (typeof this.database.eridu_semaphore_acquire === "function") {
            return;
        }

        this.database.defineCommand("eridu_semaphore_acquire", {
            numberOfKeys: 2,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local limitKey = KEYS[2];
                local slotId = ARGV[1];
                local limit = tonumber(ARGV[2]);
                local expiration = tonumber(ARGV[3]);
                local currentDate = tonumber(ARGV[4]);

                local semaphore = semaphoreFactory(currentDate)
                return semaphore.acquire(key, limitKey, slotId, limit, expiration)
            `,
        });
    }

    private initReleaseCommand(): void {
        if (typeof this.database.eridu_semaphore_release === "function") {
            return;
        }
        this.database.defineCommand("eridu_semaphore_release", {
            numberOfKeys: 2,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local limitKey = KEYS[2];
                local slotId = ARGV[1];
                local currentDate = tonumber(ARGV[2]);

                local semaphore = semaphoreFactory(currentDate)
                return semaphore.release(key, limitKey, slotId)
            `,
        });
    }

    private initForceReleaseAllCommand(): void {
        if (
            typeof this.database.eridu_semaphore_force_release_all ===
            "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_semaphore_force_release_all", {
            numberOfKeys: 2,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local limitKey = KEYS[2];
                local currentDate = tonumber(ARGV[1]);

                local semaphore = semaphoreFactory(currentDate)
                return semaphore.forceReleaseAll(key, limitKey)
            `,
        });
    }

    private initRefreshCommand(): void {
        if (typeof this.database.eridu_semaphore_refresh === "function") {
            return;
        }

        this.database.defineCommand("eridu_semaphore_refresh", {
            numberOfKeys: 2,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local limitKey = KEYS[2];
                local slotId = ARGV[1];
                local newExpiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local semaphore = semaphoreFactory(currentDate)
                return semaphore.refresh(key, limitKey, slotId, newExpiration)
            `,
        });
    }

    private initGetStateCommand(): void {
        if (typeof this.database.eridu_semaphore_get_state === "function") {
            return;
        }

        this.database.defineCommand("eridu_semaphore_get_state", {
            numberOfKeys: 2,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local limitKey = KEYS[2];
                local currentDate = tonumber(ARGV[1]);

                local semaphore = semaphoreFactory(currentDate)
                local state = semaphore.getState(key, limitKey)
                return cjson.encode(state)
            `,
        });
    }

    init(): void {
        this.initAcquireCommand();
        this.initReleaseCommand();
        this.initForceReleaseAllCommand();
        this.initRefreshCommand();
        this.initGetStateCommand();
    }

    private shardingKey(key: string): string {
        if (this.useShardingKey) {
            return `{${key}}`;
        }
        return key;
    }

    private toRedisKeys(key: string): SemaphoreKeys {
        const slotKey = this.shardingKey(key);
        return {
            slotKey,
            limitKey: `${slotKey}__limit`,
        };
    }

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;
        const { slotKey, limitKey } = this.toRedisKeys(key);
        const result = await this.database.eridu_semaphore_acquire(
            slotKey,
            limitKey,
            slotId,
            limit,
            ttl?.getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async release(key: string, slotId: string): Promise<boolean> {
        const { slotKey, limitKey } = this.toRedisKeys(key);
        const result = await this.database.eridu_semaphore_release(
            slotKey,
            limitKey,
            slotId,
            Date.now(),
        );
        return result === 1;
    }

    async forceReleaseAll(key: string): Promise<boolean> {
        const { slotKey, limitKey } = this.toRedisKeys(key);
        const hasDeleted =
            await this.database.eridu_semaphore_force_release_all(
                slotKey,
                limitKey,
                Date.now(),
            );
        return hasDeleted === 1;
    }

    async refresh(key: string, slotId: string, ttl: Date): Promise<boolean> {
        const { slotKey, limitKey } = this.toRedisKeys(key);
        const result = await this.database.eridu_semaphore_refresh(
            slotKey,
            limitKey,
            slotId,
            ttl.getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async getState(key: string): Promise<ISemaphoreAdapterState | null> {
        const { slotKey, limitKey } = this.toRedisKeys(key);
        const json = JSON.parse(
            await this.database.eridu_semaphore_get_state(
                slotKey,
                limitKey,
                Date.now(),
            ),
        ) as IRedisJsonSemaphoreState | null;
        if (json === null) {
            return null;
        }
        return {
            limit: json.limit,
            acquiredSlots: new Map(
                Object.entries(json.acquiredSlots).map(([key_, expiration]) => {
                    if (expiration === null) {
                        return [key_, null] as const;
                    }
                    return [key_, new Date(expiration)];
                }),
            ),
        };
    }
}
