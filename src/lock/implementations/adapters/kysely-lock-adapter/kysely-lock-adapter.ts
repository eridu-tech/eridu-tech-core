/**
 * @module Lock
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type {
    ILockAdapter,
    ILockAdapterState,
} from "@/lock/contracts/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export type KyselyLockEntryTable = {
    key: string;
    owner: string;
    // In ms since unix epoch.
    // The type in mysql is bigint and will be returned as a string.
    // Some sql database drivers have support for js bigint if enabled. Meaning bigint will be returned.
    expiration: number | bigint | string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export type KyselyLockTables = {
    lock: KyselyLockEntryTable;
};

/**
 * Configuration for `KyselyLockAdapter`.
 * Requires a Kysely database instance with the lock schema applied.
 *
 * IMPORT_PATH: `"eridu-tech/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export type KyselyLockAdapterSettings = {
    /**
     * The `TransactionContext` used to store lock state.
     *
     * The adapter is transaction aware: its operations run inside the context's active transaction. Adapters given the same instance share the same transaction.
     */
    transactionContext: ITransactionContext<Kysely<KyselyLockTables>>;
};

/**
 * To utilize the `KyselyLockAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselyLockAdapter` correctly, ensure you use a single, consistent database across all server instances and use a database that has support for transactions.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"eridu-tech/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export class KyselyLockAdapter
    implements ILockAdapter, IDeinitizable, IInitizable, IPrunable
{
    private readonly transactionContext: ITransactionContext<
        Kysely<KyselyLockTables>
    >;
    private readonly isMysql: boolean;

    /**
     * @example
     * ```ts
     * import { KyselyLockAdapter } from "eridu-tech/lock/kysely-lock-adapter";
     * import { contextToken } from "eridu-tech/execution-context/contracts";
     * import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
     * import { ExecutionContext } from "eridu-tech/execution-context";
     * import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
     * import { TransactionContext } from "eridu-tech/transaction-context";
     * import Sqlite from "better-sqlite3";
     * import { Kysely, SqliteDialect } from "kysely";
     *
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
     * const lockAdapter = new KyselyLockAdapter({
     *   transactionContext,
     * });
     * // You need initialize the adapter once before using it.
     * await lockAdapter.init();
     * ```
     */
    constructor(settings: KyselyLockAdapterSettings) {
        const { transactionContext } = settings;
        this.transactionContext = transactionContext;
        this.isMysql =
            this.transactionContext.client.getExecutor().adapter instanceof
            MysqlAdapter;
    }

    /**
     * Removes all related lock tables and their rows.
     * Note all lock data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropIndex("lock_expiration")
                .on("lock")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropTable("lock")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Creates all related tables and indexes.
     * Note the `init` method needs to be called once before using the adapter.
     */
    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .createTable("lock")
                .addColumn("key", "varchar(255)", (col) =>
                    col.primaryKey().notNull(),
                )
                .addColumn("owner", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .createIndex("lock_expiration")
                .on("lock")
                .column("expiration")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.transactionContext.client
            .deleteFrom("lock")
            .where("lock.expiration", "<=", Date.now())
            .execute();
    }

    async acquire(
        key: string,
        lockId: string,
        ttl: Date | null,
    ): Promise<boolean> {
        return await this.transactionContext.run(async () => {
            const existing = await this.transactionContext.current
                .selectFrom("lock")
                .where("lock.key", "=", key)
                .select(["lock.owner", "lock.expiration"])
                .executeTakeFirst();

            if (existing) {
                const isExpired =
                    existing.expiration !== null &&
                    Number(existing.expiration) <= Date.now();

                if (!isExpired && existing.owner !== lockId) {
                    return false;
                }
            }

            const expiration = ttl?.getTime() ?? null;

            await this.transactionContext.current
                .insertInto("lock")
                .values({ key, owner: lockId, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((oc) =>
                        oc.column("key").doUpdateSet({
                            key,
                            owner: lockId,
                            expiration,
                        }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({
                        key,
                        owner: lockId,
                        expiration,
                    }),
                )
                .execute();

            return true;
        });
    }

    async release(key: string, lockId: string): Promise<boolean> {
        if (this.isMysql) {
            return await this.transactionContext.run(async () => {
                const existing = await this.transactionContext.current
                    .selectFrom("lock")
                    .where("lock.key", "=", key)
                    .where("lock.owner", "=", lockId)
                    .where((eb) =>
                        eb.or([
                            eb("lock.expiration", "is", null),
                            eb("lock.expiration", ">", Date.now()),
                        ]),
                    )
                    .select("lock.key")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await this.transactionContext.current
                    .deleteFrom("lock")
                    .where("lock.key", "=", key)
                    .where("lock.owner", "=", lockId)
                    .execute();

                return true;
            });
        }

        const result = await this.transactionContext.current
            .deleteFrom("lock")
            .where("lock.key", "=", key)
            .where("lock.owner", "=", lockId)
            .where((eb) =>
                eb.or([
                    eb("lock.expiration", "is", null),
                    eb("lock.expiration", ">", Date.now()),
                ]),
            )
            .returning("lock.key")
            .executeTakeFirst();

        return result !== undefined;
    }

    async forceRelease(key: string): Promise<boolean> {
        if (this.isMysql) {
            return await this.transactionContext.run(async () => {
                const existing = await this.transactionContext.current
                    .selectFrom("lock")
                    .where("lock.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb("lock.expiration", "is", null),
                            eb("lock.expiration", ">", Date.now()),
                        ]),
                    )
                    .select("lock.key")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await this.transactionContext.current
                    .deleteFrom("lock")
                    .where("lock.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.transactionContext.current
            .deleteFrom("lock")
            .where("lock.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("lock.expiration", "is", null),
                    eb("lock.expiration", ">", Date.now()),
                ]),
            )
            .returning("lock.key")
            .executeTakeFirst();

        return result !== undefined;
    }

    async refresh(key: string, lockId: string, ttl: Date): Promise<boolean> {
        const expiration = ttl.getTime();
        const result = await this.transactionContext.current
            .updateTable("lock")
            .where("lock.key", "=", key)
            .where("lock.owner", "=", lockId)
            .where((eb) =>
                eb.and([
                    eb("lock.expiration", "is not", null),
                    eb("lock.expiration", ">", Date.now()),
                ]),
            )
            .set({ expiration })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    async getState(key: string): Promise<ILockAdapterState | null> {
        const row = await this.transactionContext.current
            .selectFrom("lock")
            .where("lock.key", "=", key)
            .select(["lock.owner", "lock.expiration"])
            .executeTakeFirst();

        if (row === undefined) {
            return null;
        }

        if (row.expiration !== null && Number(row.expiration) <= Date.now()) {
            return null;
        }

        return {
            owner: row.owner,
            expiration:
                row.expiration === null
                    ? null
                    : new Date(Number(row.expiration)),
        };
    }
}
