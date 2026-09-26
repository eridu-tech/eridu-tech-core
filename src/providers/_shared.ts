import type { KyselyConfig, KyselyProps } from "kysely";

export type KyselyConfigWithoutDialect = Omit<KyselyConfig, "dialect">;
export type KyselyPropsWithoutDialect = Omit<
    KyselyProps,
    "dialect" | "config"
> & {
    config: KyselyConfigWithoutDialect;
};

export type KyselyProviderSettings =
    KyselyConfigWithoutDialect | KyselyPropsWithoutDialect;

/**
 * Distinguishes a {@link KyselyConfigWithoutDialect} from a
 * {@link KyselyPropsWithoutDialect}. Only the latter carries a `config`
 * property, so its presence is a reliable discriminant.
 *
 * @internal
 */
export function isKyselyConfigWithoutDialect(
    settings: KyselyProviderSettings,
): settings is KyselyConfigWithoutDialect {
    return !("config" in settings);
}
