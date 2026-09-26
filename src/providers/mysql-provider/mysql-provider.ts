import { createPool } from "mysql2";

import { genericToken } from "@/di/contracts/container.contract.js";
import { callInvocable } from "@/utilities/_module.js";

import type { Pool, PoolOptions } from "mysql2";

import type { ServiceProviderFn } from "@/di/contracts/container.contract.js";
import type { Invocable } from "@/utilities/_module.js";

export const MYSQL_CLIENT = genericToken<Pool>("MYSQL_CLIENT");

export type MysqlProviderSettings = PoolOptions & {
    /**
     * Useful when wanting to set/configure mysql settings
     */
    onInit?: Invocable<[database: Pool], Promise<void>>;
};

export function mysqlProvider(
    settings: MysqlProviderSettings = {},
): ServiceProviderFn {
    const { onInit, ...rest } = settings;
    return (container) => {
        container.registerValue({
            token: MYSQL_CLIENT,
            value: createPool(rest),
        });
        if (onInit) {
            container.onContainerInit(async (resolver) => {
                const client = await resolver.resolveOrFail(MYSQL_CLIENT);
                await callInvocable(onInit, client);
            });
        }
        container.onContainerDeInit(async (resolver) => {
            const client = await resolver.resolveOrFail(MYSQL_CLIENT);

            await new Promise<void>((resolve, reject) => {
                client.end((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        });
    };
}
