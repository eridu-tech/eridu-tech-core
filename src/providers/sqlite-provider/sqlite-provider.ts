import Sqlite from "better-sqlite3";

import { genericToken } from "@/di/contracts/container.contract.js";
import { callInvocable } from "@/utilities/_module.js";

import type { Database, Options } from "better-sqlite3";

import type {
    DiToken,
    ServiceProviderFn,
} from "@/di/contracts/container.contract.js";
import type { Invocable } from "@/utilities/_module.js";

export const SQLITE_CLIENT: DiToken<Database> =
    genericToken<Database>("SQLITE_CLIENT");

export type SqliteProviderSettings = Partial<Options> & {
    filename?: string | Buffer;
    /**
     * Useful when wanting to set/configure sqlite pragma settings, like WAL mode and so on
     */
    onInit?: Invocable<[database: Database], void>;
};

export function sqliteProvider(
    settings: SqliteProviderSettings = {},
): ServiceProviderFn {
    const { filename, onInit, ...rest } = settings;
    return (container) => {
        container.registerValue({
            token: SQLITE_CLIENT,
            value: new Sqlite(filename, rest),
        });
        if (onInit) {
            container.onContainerInit(async (resolver) => {
                const client = await resolver.resolveOrFail(SQLITE_CLIENT);
                callInvocable(onInit, client);
            });
        }
        container.onContainerDeInit(async (resolver) => {
            const client = await resolver.resolveOrFail(SQLITE_CLIENT);
            client.close();
        });
    };
}
