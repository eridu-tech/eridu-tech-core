/**
 * @module CircuitBreaker
 */

import {
    BACKOFFS,
    resolveBackoffSettingsEnum,
    serializeBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import {
    CIRCUIT_BREAKER_STATE,
    BREAKER_POLICIES,
} from "@/circuit-breaker/contracts/_module-exports.js";
import {
    resolveCircuitBreakerPolicySettings,
    serializeCircuitBreakerPolicySettingsEnum,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import { circuitBreakerFactoryLua } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/lua/_module.js";
import { containsRedisClusterHashTag } from "@/utilities/_module-exports.js";

import type { Cluster, Redis, Result } from "ioredis";

import type { BackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    CircuitBreakerPolicySettingsEnum,
    CircuitBreakerState,
    CircuitBreakerStateTransition,
    ICircuitBreakerAdapter,
    AllCircuitBreakerState,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * Configuration for `RedisCircuitBreakerAdapter`.
 * Requires a Redis client.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/redis-circuit-breaker-adapter"`
 * @group Adapters
 */
export type RedisCircuitBreakerAdapterSettings = {
    /**
     * The Redis client instance for circuit-breaker state operations.
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
     * { type: POLICIES.CONSECUTIVE }
     * ```
     */
    circuitBreakerPolicy?: CircuitBreakerPolicySettingsEnum;
};

declare module "ioredis" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface RedisCommander<Context> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_circuit_breaker_update_state(
            key: string,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<string, Context>;

        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_circuit_breaker_track_failure(
            key: string,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<void, Context>;

        // eslint-disable-next-line @typescript-eslint/naming-convention
        eridu_circuit_breaker_track_success(
            key: string,
            backoffSettings: string,
            policySettings: string,
            currentDate: number,
        ): Result<void, Context>;
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/redis-circuit-breaker-adapter"`
 * @group Adapters
 */
export class RedisCircuitBreakerAdapter
    implements ICircuitBreakerAdapter, IInitizable
{
    private readonly backoff: Required<BackoffSettingsEnum>;

    private readonly policy: Required<CircuitBreakerPolicySettingsEnum>;

    private readonly database: Redis | Cluster;

    private readonly useShardingKey: boolean;

    constructor(settings: RedisCircuitBreakerAdapterSettings) {
        const {
            database,
            useShardingKey = true,
            backoffPolicy = {
                type: BACKOFFS.EXPONENTIAL,
            },
            circuitBreakerPolicy = {
                type: BREAKER_POLICIES.CONSECUTIVE,
            },
        } = settings;

        this.database = database;
        this.useShardingKey = useShardingKey;
        this.backoff = resolveBackoffSettingsEnum(backoffPolicy);
        this.policy = resolveCircuitBreakerPolicySettings(circuitBreakerPolicy);
    }

    private shardingKey(key: string): string {
        if (this.useShardingKey && !containsRedisClusterHashTag(key)) {
            return `{${key}}`;
        }
        return key;
    }

    private initUpdateStateCommmand(): void {
        if (
            typeof this.database.eridu_circuit_breaker_update_state ===
            "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_circuit_breaker_update_state", {
            numberOfKeys: 1,
            lua: `
            ${circuitBreakerFactoryLua}

            local key = KEYS[1];
            local backoffSettings = cjson.decode(ARGV[1]);
            local policySettings = cjson.decode(ARGV[2]);
            local currentDate = tonumber(ARGV[3]);

            local circuitBreaker = circuitBreakerFactory(backoffSettings, policySettings, currentDate)
            local transition = circuitBreaker.updateState(key)
            return cjson.encode(transition)
            `,
        });
    }

    private initTrackFailureCommmand(): void {
        if (
            typeof this.database.eridu_circuit_breaker_track_failure ===
            "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_circuit_breaker_track_failure", {
            numberOfKeys: 1,
            lua: `
            ${circuitBreakerFactoryLua}

            local key = KEYS[1];
            local backoffSettings = cjson.decode(ARGV[1]);
            local policySettings = cjson.decode(ARGV[2]);
            local currentDate = tonumber(ARGV[3]);

            local circuitBreaker = circuitBreakerFactory(backoffSettings, policySettings, currentDate)
            circuitBreaker.trackFailure(key)
            `,
        });
    }

    private initTrackSuccessCommmand(): void {
        if (
            typeof this.database.eridu_circuit_breaker_track_success ===
            "function"
        ) {
            return;
        }

        this.database.defineCommand("eridu_circuit_breaker_track_success", {
            numberOfKeys: 1,
            lua: `
            ${circuitBreakerFactoryLua}

            local key = KEYS[1];
            local backoffSettings = cjson.decode(ARGV[1]);
            local policySettings = cjson.decode(ARGV[2]);
            local currentDate = tonumber(ARGV[3]);

            local circuitBreaker = circuitBreakerFactory(backoffSettings, policySettings, currentDate)
            circuitBreaker.trackSuccess(key)
            `,
        });
    }

    init(): void {
        this.initUpdateStateCommmand();
        this.initTrackFailureCommmand();
        this.initTrackSuccessCommmand();
    }

    async getState(key: string): Promise<CircuitBreakerState> {
        const value = await this.database.get(this.shardingKey(key));
        if (value === null) {
            return CIRCUIT_BREAKER_STATE.CLOSED;
        }
        const state = JSON.parse(value) as AllCircuitBreakerState;
        return state.type;
    }

    async updateState(key: string): Promise<CircuitBreakerStateTransition> {
        const value = await this.database.eridu_circuit_breaker_update_state(
            this.shardingKey(key),
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(
                serializeCircuitBreakerPolicySettingsEnum(this.policy),
            ),
            Date.now(),
        );
        return JSON.parse(value) as CircuitBreakerStateTransition;
    }

    async isolate(key: string): Promise<void> {
        await this.database.set(
            this.shardingKey(key),
            JSON.stringify({
                type: CIRCUIT_BREAKER_STATE.ISOLATED,
            }),
        );
    }

    async trackFailure(key: string): Promise<void> {
        await this.database.eridu_circuit_breaker_track_failure(
            this.shardingKey(key),
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(
                serializeCircuitBreakerPolicySettingsEnum(this.policy),
            ),
            Date.now(),
        );
    }

    async trackSuccess(key: string): Promise<void> {
        await this.database.eridu_circuit_breaker_track_success(
            this.shardingKey(key),
            JSON.stringify(serializeBackoffSettingsEnum(this.backoff)),
            JSON.stringify(
                serializeCircuitBreakerPolicySettingsEnum(this.policy),
            ),
            Date.now(),
        );
    }

    async reset(key: string): Promise<void> {
        await this.database.del(this.shardingKey(key));
    }
}
