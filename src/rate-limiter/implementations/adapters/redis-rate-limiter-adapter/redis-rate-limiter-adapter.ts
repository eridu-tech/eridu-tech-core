/**
 * @module RateLimiter
 */

import {
    BACKOFFS,
    resolveBackoffSettingsEnum,
    serializeBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/contracts/_module-exports.js";
import {
    resolveRateLimiterPolicySettings,
    serializeRateLimiterPolicySettingsEnum,
} from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { rateLimiterFactoryLua } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/lua/_module.js";
import { containsRedisClusterHashTag } from "@/utilities/_module-exports.js";

import type { Cluster, Redis, Result } from "ioredis";

import type { BackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
    RateLimiterPolicySettingsEnum,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
type IRedisJsonRateLimiterState = {
    success: boolean;
    attempt: number;
    resetTime: number;
};

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        /**
         * @returns {string} {@link IRedisJsonRateLimiterState | `IRedisJsonRateLimiterState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_rate_limiter_update_state(
            key: string,
            limit: number,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<string, Context>;

        /**
         * @returns {string} {@link IRedisJsonRateLimiterState | `IRedisJsonRateLimiterState`} or `null` as json string.
         */
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_rate_limiter_get_state(
            key: string,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<string, Context>;
    }
}

/**
 * Configuration for `RedisRateLimiterAdapter`.
 * Requires a Redis client and handles serialization internally with JSON.stringify/JSON.parse.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/redis-rate-limiter-adapter"`
 * @group Adapters
 */
export type RedisRateLimiterAdapterSettings = {
    /**
     * The Redis client instance for rate-limiter state operations.
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

    /**
     * You can choose between different types of predefined backoff policies.
     * @default
     * ```ts
     * { type: BACKOFFS.EXPONENTIAL }
     * ```
     */
    backoffPolicy?: BackoffSettingsEnum;

    /**
     * You can choose between different types of predefined circuit breaker policies.
     * @default
     * ```ts
     * { type: LIMITER.FIXED_WINDOW }
     * ```
     */
    rateLimiterPolicy?: RateLimiterPolicySettingsEnum;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/redis-rate-limiter-adapter"`
 * @group Adapters
 */
export class RedisRateLimiterAdapter
    implements IRateLimiterAdapter, IInitizable
{
    private readonly backoff: Required<BackoffSettingsEnum>;

    private readonly policy: Required<RateLimiterPolicySettingsEnum>;

    private readonly database: Redis | Cluster;

    private readonly useShardingKey: boolean;

    constructor(settings: RedisRateLimiterAdapterSettings) {
        const {
            database,
            useShardingKey = true,
            backoffPolicy = {
                type: BACKOFFS.EXPONENTIAL,
            },
            rateLimiterPolicy = {
                type: LIMITER_POLICIES.FIXED_WINDOW,
            },
        } = settings;

        this.database = database;
        this.useShardingKey = useShardingKey;
        this.backoff = resolveBackoffSettingsEnum(backoffPolicy);
        this.policy = resolveRateLimiterPolicySettings(rateLimiterPolicy);
    }

    private shardingKey(key: string): string {
        if (this.useShardingKey && !containsRedisClusterHashTag(key)) {
            return `{${key}}`;
        }
        return key;
    }

    private initGetStateCommand(): void {
        if (typeof this.database.eridu_rate_limiter_get_state === "function") {
            return;
        }

        this.database.defineCommand("eridu_rate_limiter_get_state", {
            numberOfKeys: 1,
            lua: `
            ${rateLimiterFactoryLua}

            local key = KEYS[1];
            local backoffSettings = cjson.decode(ARGV[1]);
            local policySettings = cjson.decode(ARGV[2]);
            local currentDate = tonumber(ARGV[3]);

            local rateLimiter = rateLimiterFactory(backoffSettings, policySettings, currentDate)
            local state = rateLimiter.storage.find(key)
            return cjson.encode(state)
            `,
        });
    }

    private initUpdateStateCommmand(): void {
        if (
            typeof this.database.eridu_rate_limiter_update_state === "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_rate_limiter_update_state", {
            numberOfKeys: 1,
            lua: `
            ${rateLimiterFactoryLua}

            local key = KEYS[1];
            local limit = tonumber(ARGV[1]);
            local backoffSettings = cjson.decode(ARGV[2]);
            local policySettings = cjson.decode(ARGV[3]);
            local currentDate = tonumber(ARGV[4]);

            local rateLimiter = rateLimiterFactory(backoffSettings, policySettings, currentDate)
            local track = rateLimiter.stateManager.track(currentDate)
            local updateState = rateLimiter.stateManager.updateState(limit, currentDate)
            local state = rateLimiter.storage.update({
                key = key,
                update = function(prevState)
                    local newState1 = track(prevState)
                    local newState2 = updateState(newState1)
                    return newState2
                end
            })
            return cjson.encode(state)
            `,
        });
    }

    init(): void {
        this.initGetStateCommand();
        this.initUpdateStateCommmand();
    }

    async getState(key: string): Promise<IRateLimiterAdapterState | null> {
        const json = await this.database.eridu_rate_limiter_get_state(
            this.shardingKey(key),
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(serializeRateLimiterPolicySettingsEnum(this.policy)),
            Date.now(),
        );
        const state = JSON.parse(json) as IRedisJsonRateLimiterState | null;
        if (state === null) {
            return null;
        }
        return {
            success: state.success,
            attempt: state.attempt,
            resetTime: new Date(state.resetTime),
        };
    }

    async updateState(
        key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState> {
        const json = await this.database.eridu_rate_limiter_update_state(
            this.shardingKey(key),
            limit,
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(serializeRateLimiterPolicySettingsEnum(this.policy)),
            Date.now(),
        );
        const state = JSON.parse(json) as IRedisJsonRateLimiterState;
        return {
            success: state.success,
            attempt: state.attempt,
            resetTime: new Date(state.resetTime),
        };
    }

    async reset(key: string): Promise<void> {
        await this.database.del(this.shardingKey(key));
    }
}
