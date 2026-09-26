import { MongoClient } from "mongodb";

import { genericToken } from "@/di/contracts/container.contract.js";

import type { MongoClientOptions } from "mongodb";

import type { ServiceProviderFn } from "@/di/contracts/container.contract.js";

export const MONGODB_CLIENT = genericToken<MongoClient>("MONGODB_CLIENT");

export type MongodbProviderSettings = Partial<MongoClientOptions> & {
    url: string;

    /**
     * @default true
     */
    eagerConnect?: boolean;
};

export function mongodbProvider(
    settings: MongodbProviderSettings,
): ServiceProviderFn {
    const { url, eagerConnect = true, ...rest } = settings;
    return (container) => {
        container.registerValue({
            token: MONGODB_CLIENT,
            value: new MongoClient(url, rest),
        });
        container.onContainerInit(async (resolver) => {
            const client = await resolver.resolveOrFail(MONGODB_CLIENT);
            if (eagerConnect) {
                await client.connect();
            }
        });
        container.onContainerDeInit(async (resolver) => {
            const client = await resolver.resolveOrFail(MONGODB_CLIENT);
            await client.close();
        });
    };
}
