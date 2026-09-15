/**
 * @module Cache
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type { ICacheAdapter } from "@/cache/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
    IPrunable,
    Promisable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheEntryTable = {
    key: string;
    value: string;
    // In ms since unix epoch
    expiration: number | string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheTables = {
    cache: KyselyCacheEntryTable;
};

/**
 * Configuration for `KyselyCacheAdapter`.
 * Requires a Kysely database instance and a serde for serialising cache values to strings.
 *
 * IMPORT_PATH: `"eridu-tech/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export type KyselyCacheAdapterSettings = {
    /**
     * The `TransactionContext` used to store cache entries.
     *
     * The adapter is transaction aware: its operations run inside the context's active transaction. Adapters given the same instance share the same transaction.
     */
    transactionContext: ITransactionContext<Kysely<KyselyCacheTables>>;

    /**
     * Serde instance for serializing and deserializing cache values to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * To utilize the `KyselyCacheAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"eridu-tech/cache/kysely-cache-adapter"`
 * @group Adapters
 */
export class KyselyCacheAdapter<TType = unknown>
    implements ICacheAdapter<TType>, IInitizable, IDeinitizable, IPrunable
{
    private readonly isMysql: boolean;
    private readonly serde: ISerde<string>;
    private readonly transactionContext: ITransactionContext<
        Kysely<KyselyCacheTables>
    >;

    /**
     * @example
     * ```ts
     * import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
     * import { contextToken } from "eridu-tech/execution-context/contracts";
     * import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
     * import { ExecutionContext } from "eridu-tech/execution-context";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
     * import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
     * import { TransactionContext } from "eridu-tech/transaction-context";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const transactionContext = new TransactionContext({
     *   token: contextToken("kysely"),
     *   executionContext: new ExecutionContext(new AlsExecutionContextAdapter()),
     *   adapter: new KyselyTransactionAdapter({
     *     database: new Kysely({
     *       dialect: new SqliteDialect({
     *         database: new Sqlite("local.db"),
     *       }),
     *     }),
     *   }),
     * });
     * const cacheAdapter = new KyselyCacheAdapter({
     *   transactionContext,
     *   serde,
     * });
     * // You need initialize the adapter once before using it.
     * await cacheAdapter.init();
     * ```
     */
    constructor(settings: KyselyCacheAdapterSettings) {
        const { transactionContext, serde } = settings;
        this.transactionContext = transactionContext;
        this.serde = serde;
        this.isMysql =
            this.transactionContext.client.getExecutor().adapter instanceof
            MysqlAdapter;
    }

    async removeAllExpired(): Promise<void> {
        await this.transactionContext.client
            .deleteFrom("cache")
            .where("cache.expiration", "<=", Date.now())
            .execute();
    }

    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .createTable("cache")
                .addColumn("key", "varchar(255)", (col) => col.primaryKey())
                .addColumn("value", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .createIndex("cache_expiration")
                .on("cache")
                .columns(["expiration"])
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes all related cache tables and their rows.
     * Note all cache data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropIndex("cache_expiration")
                .on("cache")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropTable("cache")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    async get(key: string): Promise<TType | null> {
        const row = await this.transactionContext.current
            .selectFrom("cache")
            .where("cache.key", "=", key)
            .select(["cache.value", "cache.expiration"])
            .executeTakeFirst();

        if (!row) {
            return null;
        }

        if (row.expiration !== null && Number(row.expiration) <= Date.now()) {
            return null;
        }

        return this.serde.deserialize(row.value);
    }

    async getAndRemove(key: string): Promise<TType | null> {
        if (this.isMysql) {
            return await this.transactionContext.run(async () => {
                const row = await this.transactionContext.current
                    .selectFrom("cache")
                    .where("cache.key", "=", key)
                    .select(["cache.value", "cache.expiration"])
                    .executeTakeFirst();

                if (!row) {
                    return null;
                }

                await this.transactionContext.current
                    .deleteFrom("cache")
                    .where("cache.key", "=", key)
                    .execute();

                if (
                    row.expiration !== null &&
                    Number(row.expiration) <= Date.now()
                ) {
                    return null;
                }

                return this.serde.deserialize(row.value);
            });
        }

        const row = await this.transactionContext.current
            .deleteFrom("cache")
            .where("cache.key", "=", key)
            .returning(["cache.value", "cache.expiration"])
            .executeTakeFirst();

        if (!row) {
            return null;
        }

        if (row.expiration !== null && Number(row.expiration) <= Date.now()) {
            return null;
        }

        return this.serde.deserialize(row.value);
    }

    async add(key: string, value: TType, ttl: Date | null): Promise<boolean> {
        return await this.transactionContext.run(async () => {
            const existing = await this.transactionContext.current
                .selectFrom("cache")
                .where("cache.key", "=", key)
                .select("cache.expiration")
                .executeTakeFirst();

            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= Date.now();
                if (!isExpired) {
                    return false;
                }
            }

            const serializedValue = this.serde.serialize(value);
            const expiration = ttl?.getTime() ?? null;

            await this.transactionContext.current
                .insertInto("cache")
                .values({ key, value: serializedValue, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((oc) =>
                        oc.column("key").doUpdateSet({
                            key,
                            value: serializedValue,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        value: serializedValue,
                        expiration,
                    }),
                )
                .execute();

            return true;
        });
    }

    async getOrAdd(
        key: string,
        valueToAdd: InvocableFn<[], Promisable<TType>>,
        ttl: Date | null,
    ): Promise<TType> {
        return await this.transactionContext.run(async () => {
            const existing = await this.transactionContext.current
                .selectFrom("cache")
                .where("cache.key", "=", key)
                .select(["cache.value", "cache.expiration"])
                .executeTakeFirst();

            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= Date.now();
                if (!isExpired) {
                    return this.serde.deserialize(existing.value);
                }
            }

            const serializedValue = this.serde.serialize(valueToAdd());
            const expiration = ttl?.getTime() ?? null;

            await this.transactionContext.current
                .insertInto("cache")
                .values({ key, value: serializedValue, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((oc) =>
                        oc.column("key").doUpdateSet({
                            key,
                            value: serializedValue,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        value: serializedValue,
                        expiration,
                    }),
                )
                .execute();

            return valueToAdd();
        });
    }

    async put(key: string, value: TType, ttl: Date | null): Promise<boolean> {
        return await this.transactionContext.run(async () => {
            const existing = await this.transactionContext.current
                .selectFrom("cache")
                .where("cache.key", "=", key)
                .select("cache.expiration")
                .executeTakeFirst();

            let keyExistedAndNotExpired = false;
            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= Date.now();
                keyExistedAndNotExpired = !isExpired;
            }

            const serializedValue = this.serde.serialize(value);
            const expiration = ttl?.getTime() ?? null;

            await this.transactionContext.current
                .insertInto("cache")
                .values({ key, value: serializedValue, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((oc) =>
                        oc.column("key").doUpdateSet({
                            key,
                            value: serializedValue,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        value: serializedValue,
                        expiration,
                    }),
                )
                .execute();

            return keyExistedAndNotExpired;
        });
    }

    async update(key: string, value: TType): Promise<boolean> {
        const serializedValue = this.serde.serialize(value);
        const result = await this.transactionContext.current
            .updateTable("cache")
            .where("cache.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("cache.expiration", "is", null),
                    eb("cache.expiration", ">", Date.now()),
                ]),
            )
            .set({ value: serializedValue })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    async increment(key: string, value: number): Promise<boolean> {
        return await this.transactionContext.run(async () => {
            const existing = await this.transactionContext.current
                .selectFrom("cache")
                .where("cache.key", "=", key)
                .where((eb) =>
                    eb.or([
                        eb("cache.expiration", "is", null),
                        eb("cache.expiration", ">", Date.now()),
                    ]),
                )
                .select("cache.value")
                .executeTakeFirst();

            if (!existing) {
                return false;
            }

            const currentValue = this.serde.deserialize(existing.value);

            if (typeof currentValue !== "number" || isNaN(currentValue)) {
                throw new TypeError(
                    `Unable to increment or decrement none number type key "${key}"`,
                );
            }

            const newValue = currentValue + value;

            await this.transactionContext.current
                .updateTable("cache")
                .where("cache.key", "=", key)
                .set({ value: this.serde.serialize(newValue) })
                .execute();

            return true;
        });
    }

    async removeMany(keys: Array<string>): Promise<boolean> {
        if (keys.length === 0) {
            return false;
        }

        const result = await this.transactionContext.current
            .deleteFrom("cache")
            .where("cache.key", "in", keys)
            .execute();

        return Number(result[0]?.numDeletedRows ?? 0n) > 0;
    }

    private async removeAll(): Promise<void> {
        await this.transactionContext.current.deleteFrom("cache").execute();
    }

    async removeByPrefix(prefix: string): Promise<void> {
        if (prefix === "") {
            await this.removeAll();
            return;
        }
        await this.transactionContext.current
            .deleteFrom("cache")
            .where("cache.key", "like", `${prefix}%`)
            .execute();
    }
}
