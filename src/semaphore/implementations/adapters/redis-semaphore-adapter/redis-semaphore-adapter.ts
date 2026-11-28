/**
 * @module Semaphore
 */

import { semaphoreFactoryLua } from "@/semaphore/implementations/adapters/redis-semaphore-adapter/lua/_module.js";

import type { Redis, Result } from "ioredis";

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
     * `0` means the slot never expires.
     */
    acquiredSlots: Record<string, number>;
};

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        /**
         * @param expiration As unix timestamp in miliseconds, or `null` for an unexpireable slot
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_acquire(
            key: string,
            slotId: string,
            limit: number,
            expiration: number | null,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_release(
            key: string,
            slotId: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_force_release_all(
            key: string,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param newExpiration As unix timestamp in miliseconds
         * @param currentDate As unix timestamp in miliseconds
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_refresh(
            key: string,
            slotId: string,
            newExpiration: number,
            currentDate: number,
        ): Result<1 | 0, Context>;

        /**
         * @param currentDate As unix timestamp in miliseconds
         * @returns {@link IRedisJsonSemaphoreState | `IRedisJsonSemaphoreState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_semaphore_get_state(
            key: string,
            currentDate: number,
        ): Result<string, Context>;
    }
}

// acquiredSlots: Map<string, Date | null>;

/**
 * To utilize the `RedisSemaphoreAdapter`, you must install the `"ioredis"` package.
 *
 * Note in order to use `RedisSemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/redis-semaphore-adapter"`
 * @group Adapters
 */
export class RedisSemaphoreAdapter implements ISemaphoreAdapter, IInitizable {
    constructor(private readonly database: Redis) {}

    private initAcquireCommand(): void {
        if (typeof this.database.eridu_semaphore_acquire === "function") {
            return;
        }

        this.database.defineCommand("eridu_semaphore_acquire", {
            numberOfKeys: 1,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local slotId = ARGV[1];
                local limit = tonumber(ARGV[2]);
                local expiration = tonumber(ARGV[3]);
                local currentDate = tonumber(ARGV[4]);

                local semaphore = semaphoreFactory(currentDate)
                return semaphore.acquire(key, slotId, limit, expiration)
            `,
        });
    }

    private initReleaseCommand(): void {
        if (typeof this.database.eridu_semaphore_release === "function") {
            return;
        }
        this.database.defineCommand("eridu_semaphore_release", {
            numberOfKeys: 1,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local slotId = ARGV[1];
                local currentDate = tonumber(ARGV[2]);

                local semaphore = semaphoreFactory(currentDate)
                return semaphore.release(key, slotId)
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
            numberOfKeys: 1,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local currentDate = tonumber(ARGV[1]);

                local semaphore = semaphoreFactory(currentDate)
                return semaphore.forceReleaseAll(key)
            `,
        });
    }

    private initRefreshCommand(): void {
        if (typeof this.database.eridu_semaphore_refresh === "function") {
            return;
        }

        this.database.defineCommand("eridu_semaphore_refresh", {
            numberOfKeys: 1,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local slotId = ARGV[1];
                local newExpiration = tonumber(ARGV[2]);
                local currentDate = tonumber(ARGV[3]);

                local semaphore = semaphoreFactory(currentDate)
                return semaphore.refresh(key, slotId, newExpiration)
            `,
        });
    }

    private initGetStateCommand(): void {
        if (typeof this.database.eridu_semaphore_get_state === "function") {
            return;
        }

        this.database.defineCommand("eridu_semaphore_get_state", {
            numberOfKeys: 1,
            lua: `
                ${semaphoreFactoryLua}

                local key = KEYS[1];
                local currentDate = tonumber(ARGV[1]);

                local semaphore = semaphoreFactory(currentDate)
                local state = semaphore.getState(key)
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

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;
        const result = await this.database.eridu_semaphore_acquire(
            key,
            slotId,
            limit,
            ttl?.getTime() ?? null,
            Date.now(),
        );
        return result === 1;
    }

    async release(key: string, slotId: string): Promise<boolean> {
        const result = await this.database.eridu_semaphore_release(
            key,
            slotId,
            Date.now(),
        );
        return result === 1;
    }

    async forceReleaseAll(key: string): Promise<boolean> {
        const hasDeleted =
            await this.database.eridu_semaphore_force_release_all(
                key,
                Date.now(),
            );
        return hasDeleted === 1;
    }

    async refresh(key: string, slotId: string, ttl: Date): Promise<boolean> {
        const result = await this.database.eridu_semaphore_refresh(
            key,
            slotId,
            ttl.getTime(),
            Date.now(),
        );
        return result === 1;
    }

    async getState(key: string): Promise<ISemaphoreAdapterState | null> {
        const json = JSON.parse(
            await this.database.eridu_semaphore_get_state(key, Date.now()),
        ) as IRedisJsonSemaphoreState | null;
        if (json === null) {
            return null;
        }
        return {
            limit: json.limit,
            acquiredSlots: new Map(
                Object.entries(json.acquiredSlots).map(([key_, expiration]) => {
                    if (expiration === 0) {
                        return [key_, null] as const;
                    }
                    return [key_, new Date(expiration)];
                }),
            ),
        };
    }
}
