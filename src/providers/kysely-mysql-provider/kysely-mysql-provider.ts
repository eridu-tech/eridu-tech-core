import { MysqlDialect, Kysely } from "kysely";

import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import { isKyselyConfigWithoutDialect } from "@/providers/_shared.js";

import type { KyselyConfig, KyselyProps, MysqlDialectConfig } from "kysely";
import type { Pool } from "mysql2";

import type {
    DiToken,
    ServiceProviderFn,
} from "@/di/contracts/container.contract.js";
import type { KyselyProviderSettings } from "@/providers/_shared.js";

export const KYSELY_MYSQL = genericToken<Kysely<any>>("KYSELY_MYSQL");

export type KyselyMysqlDialectSettings = Omit<MysqlDialectConfig, "pool">;
export type KyselyMysqlProviderSettings = KyselyProviderSettings & {
    mysqlToken: DiToken<Pool>;
    dialectSettings?: KyselyMysqlDialectSettings;
};

export function kyselyMysqlProvider(
    settings: KyselyMysqlProviderSettings,
): ServiceProviderFn {
    const { mysqlToken, dialectSettings = {}, ...rest } = settings;
    return (container) => {
        container.registerFactory({
            token: KYSELY_MYSQL,
            factory: ({ client }) => {
                if (isKyselyConfigWithoutDialect(rest)) {
                    const dialect = new MysqlDialect({
                        pool: client,
                        ...dialectSettings,
                    });
                    const config: KyselyConfig = {
                        dialect,
                        ...rest,
                    };
                    return new Kysely(config);
                } else {
                    const dialect = new MysqlDialect({
                        pool: client,
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
                client: mysqlToken,
            },
            lifetime: LIFETIME.SINGLETON,
        });
    };
}
