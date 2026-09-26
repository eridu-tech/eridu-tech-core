import { Redis } from "ioredis";

import { genericToken } from "@/di/contracts/container.contract.js";

import type { RedisOptions } from "ioredis";
import type { ReplyMappingMode } from "ioredis/built/types.js";

import type { ServiceProviderFn } from "@/di/contracts/container.contract.js";

export const REDIS_CLIENT = genericToken<Redis>("REDIS_CLIENT");

export type RedisSettings<TReplyMapping extends ReplyMappingMode = "legacy"> =
    RedisOptions & {
        replyMapping?: TReplyMapping;
    };

export function redisProvider<
    TReplyMapping extends ReplyMappingMode = "legacy",
>(settings: RedisSettings<TReplyMapping> = {}): ServiceProviderFn {
    return (container) => {
        container.registerValue({
            token: REDIS_CLIENT,
            value: new Redis(settings),
        });
        container.onContainerDeInit(async (resolver) => {
            const client = await resolver.resolveOrFail(REDIS_CLIENT);
            await client.quit();
        });
    };
}
