import { Pool } from "pg";

import { genericToken } from "@/di/contracts/container.contract.js";
import { callInvocable } from "@/utilities/_module.js";

import type { PoolConfig } from "pg";

import type { ServiceProviderFn } from "@/di/contracts/container.contract.js";
import type { Invocable } from "@/utilities/_module.js";

export const POSTGRES_CLIENT = genericToken<Pool>("POSTGRES_CLIENT");

export type PostgresProviderSettings = PoolConfig & {
    /**
     * Useful when wanting to set/configure postgres settings
     */
    onInit?: Invocable<[database: Pool], Promise<void>>;
};

export function postgresProvider(
    settings: PostgresProviderSettings,
): ServiceProviderFn {
    const { onInit, ...rest } = settings;
    return (container) => {
        container.registerValue({
            token: POSTGRES_CLIENT,
            value: new Pool(rest),
        });
        if (onInit) {
            container.onContainerInit(async (resolver) => {
                const client = await resolver.resolveOrFail(POSTGRES_CLIENT);
                await callInvocable(onInit, client);
            });
        }
        container.onContainerDeInit(async (resolver) => {
            const client = await resolver.resolveOrFail(POSTGRES_CLIENT);
            await client.end();
        });
    };
}
