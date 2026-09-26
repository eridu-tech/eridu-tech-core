import { SqliteDialect, Kysely } from "kysely";

import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import { isKyselyConfigWithoutDialect } from "@/providers/_shared.js";

import type { Database } from "better-sqlite3";
import type { KyselyConfig, KyselyProps, SqliteDialectConfig } from "kysely";

import type {
    DiToken,
    ServiceProviderFn,
} from "@/di/contracts/container.contract.js";
import type { KyselyProviderSettings } from "@/providers/_shared.js";

export const KYSELY_SQLITE = genericToken<Kysely<any>>("KYSELY_SQLITE");

export type KyselySqliteDialectSettings = Omit<SqliteDialectConfig, "database">;
export type KyselySqliteProviderSettings = KyselyProviderSettings & {
    sqliteToken: DiToken<Database>;
    dialectSettings?: KyselySqliteDialectSettings;
};

export function kyselySqliteProvider(
    settings: KyselySqliteProviderSettings,
): ServiceProviderFn {
    const { sqliteToken, dialectSettings = {}, ...rest } = settings;
    return (container) => {
        container.registerFactory({
            token: KYSELY_SQLITE,
            factory: ({ client }) => {
                if (isKyselyConfigWithoutDialect(rest)) {
                    const dialect = new SqliteDialect({
                        database: client,
                        ...dialectSettings,
                    });
                    const config: KyselyConfig = {
                        dialect,
                        ...rest,
                    };
                    return new Kysely(config);
                } else {
                    const dialect = new SqliteDialect({
                        database: client,
                        ...dialectSettings,
                    });
                    const props: KyselyProps = {
                        ...rest,
                        config: {
                            dialect,
                            ...rest.config,
                        },
                        dialect,
                    };
                    return new Kysely(props);
                }
            },
            deps: {
                client: sqliteToken,
            },
            lifetime: LIFETIME.SINGLETON,
        });
    };
}
