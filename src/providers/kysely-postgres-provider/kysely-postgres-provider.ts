import { PostgresDialect, Kysely } from "kysely";

import { genericToken, LIFETIME } from "@/di/contracts/container.contract.js";
import { isKyselyConfigWithoutDialect } from "@/providers/_shared.js";

import type { KyselyConfig, KyselyProps, PostgresDialectConfig } from "kysely";
import type { Pool } from "pg";

import type {
    DiToken,
    ServiceProviderFn,
} from "@/di/contracts/container.contract.js";
import type { KyselyProviderSettings } from "@/providers/_shared.js";

export const KYSELY_POSTGRES = genericToken<Kysely<any>>("KYSELY_POSTGRES");

export type KyselyPostgresDialectSettings = Omit<PostgresDialectConfig, "pool">;
export type KyselyPostgresProviderSettings = KyselyProviderSettings & {
    postgresToken: DiToken<Pool>;
    dialectSettings?: KyselyPostgresDialectSettings;
};

export function kyselyPostgresProvider(
    settings: KyselyPostgresProviderSettings,
): ServiceProviderFn {
    const { postgresToken, dialectSettings = {}, ...rest } = settings;
    return (container) => {
        container.registerFactory({
            token: KYSELY_POSTGRES,
            factory: ({ client }) => {
                if (isKyselyConfigWithoutDialect(rest)) {
                    const dialect = new PostgresDialect({
                        pool: client,
                        ...dialectSettings,
                    });
                    const config: KyselyConfig = {
                        dialect,
                        ...rest,
                    };
                    return new Kysely(config);
                } else {
                    const dialect = new PostgresDialect({
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
                client: postgresToken,
            },
            lifetime: LIFETIME.SINGLETON,
        });
    };
}
