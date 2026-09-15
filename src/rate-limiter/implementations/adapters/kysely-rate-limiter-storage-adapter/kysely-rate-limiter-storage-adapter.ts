/**
 * @module RateLimiter
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type {
    IRateLimiterData,
    IRateLimiterStorageAdapter,
    IRateLimiterStorageAdapterTransaction,
} from "@/rate-limiter/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
    IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterTable = {
    key: string;
    state: string;
    // In ms since unix epoch.
    // The type in mysql is bigint and will be returned as a string.
    // Some sql database drivers have support for js bigint if enabled. Meaning bigint will be returned.
    expiration: number | bigint | string;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterStorageTables = {
    rateLimiter: KyselyRateLimiterTable;
};

/**
 * @internal
 */
async function find<TType>(
    kysely: Kysely<KyselyRateLimiterStorageTables>,
    serde: ISerde<string>,
    key: string,
): Promise<IRateLimiterData<TType> | null> {
    const row = await kysely
        .selectFrom("rateLimiter")
        .select(["rateLimiter.state", "rateLimiter.expiration"])
        .where("rateLimiter.key", "=", key)
        .executeTakeFirst();
    if (row === undefined) {
        return null;
    }
    return {
        state: serde.deserialize(row.state),
        expiration: new Date(Number(row.expiration)),
    };
}

/**
 * @internal
 */
class KyselyRateLimiterStorageAdapterTransaction<
    TType,
> implements IRateLimiterStorageAdapterTransaction<TType> {
    private readonly isMysql: boolean;

    constructor(
        private readonly kysely: Kysely<KyselyRateLimiterStorageTables>,
        private readonly serde: ISerde<string>,
    ) {
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
    }

    async upsert(key: string, state: TType, expiration: Date): Promise<void> {
        const expirationAsMs = expiration.getTime();
        const serializedState = this.serde.serialize(state);
        await this.kysely
            .insertInto("rateLimiter")
            .values({
                key,
                state: serializedState,
                expiration: expirationAsMs,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb_) =>
                    eb_.column("key").doUpdateSet({
                        key,
                        state: serializedState,
                        expiration: expirationAsMs,
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    key,
                    state: serializedState,
                    expiration: expirationAsMs,
                }),
            )
            .execute();
    }

    async find(key: string): Promise<IRateLimiterData<TType> | null> {
        return await find(this.kysely, this.serde, key);
    }
}

/**
 * Configuration for `KyselyRateLimiterStorageAdapter`.
 * Requires a Kysely database instance with the rate-limiter schema applied.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterStorageAdapterSettings = {
    /**
     * The `TransactionContext` used to store rate-limiter state.
     *
     * The adapter is transaction aware: its operations run inside the context's active transaction. Adapters given the same instance share the same transaction.
     */
    transactionContext: ITransactionContext<
        Kysely<KyselyRateLimiterStorageTables>
    >;
    /**
     * Serde instance for serializing and deserializing rate-limiter state to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * To utilize the `KyselyRateLimiterStorageAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselyRateLimiterStorageAdapter` correctly, you need to use a database that has support for transactions.
 * This adapter is compatible and have been tested with:
 * - `Sqlite`
 * - `Postgres`
 * - `Mysql`
 * - `Mariadb`
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export class KyselyRateLimiterStorageAdapter<TType>
    implements
        IRateLimiterStorageAdapter<TType>,
        IInitizable,
        IDeinitizable,
        IPrunable
{
    private readonly transactionContext: ITransactionContext<
        Kysely<KyselyRateLimiterStorageTables>
    >;
    private readonly serde: ISerde<string>;

    /**
     * @example
     * ```ts
     * import { KyselyRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-storage-adapter";
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
     * const rateLimiterStorageAdapter = new KyselyRateLimiterStorageAdapter({
     *   transactionContext,
     *   serde
     * });
     * // You need initialize the adapter once before using it.
     * await rateLimiterStorageAdapter.init();
     * ```
     */
    constructor(settings: KyselyRateLimiterStorageAdapterSettings) {
        const { transactionContext, serde } = settings;

        this.transactionContext = transactionContext;
        this.serde = serde;
    }

    /**
     * Removes all related rate limiter tables and their rows.
     * Note all rate limiter data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropIndex("rateLimiter_expiration")
                .on("rateLimiter")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropTable("rateLimiter")
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
                .createTable("rateLimiter")
                .addColumn("key", "varchar(255)", (col) =>
                    col.primaryKey().notNull(),
                )
                .addColumn("state", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .createIndex("rateLimiter_expiration")
                .on("rateLimiter")
                .column("expiration")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.transactionContext.client
            .deleteFrom("rateLimiter")
            .where("rateLimiter.expiration", "<=", Date.now())
            .execute();
    }

    async transaction<TValue>(
        fn: InvocableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await this.transactionContext.run(async () => {
            return await fn(
                new KyselyRateLimiterStorageAdapterTransaction(
                    this.transactionContext.current,
                    this.serde,
                ),
            );
        });
    }

    async find(key: string): Promise<IRateLimiterData<TType> | null> {
        return await find(this.transactionContext.current, this.serde, key);
    }

    async remove(key: string): Promise<void> {
        await this.transactionContext.current
            .deleteFrom("rateLimiter")
            .where("rateLimiter.key", "=", key)
            .executeTakeFirst();
    }
}
