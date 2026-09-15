/**
 * @module CircuitBreaker
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type {
    ICircuitBreakerStorageAdapter,
    ICircuitBreakerStorageAdapterTransaction,
} from "@/circuit-breaker/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerStorageTable = {
    key: string;
    state: string;
};

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerStorageTables = {
    circuitBreaker: KyselyCircuitBreakerStorageTable;
};

/**
 * Configuration for `KyselyCircuitBreakerStorageAdapter`.
 * Requires a Kysely database instance typed with the circuit-breaker storage schema.
 * Call `init()` to create the storage table when it has not already been provisioned.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerStorageAdapterSettings = {
    /**
     * The `TransactionContext` used to store circuit-breaker state.
     *
     * The adapter is transaction aware: its operations run inside the context's active transaction. Adapters given the same instance share the same transaction.
     */
    transactionContext: ITransactionContext<
        Kysely<KyselyCircuitBreakerStorageTables>
    >;
    /**
     * Serde instance for serializing and deserializing circuit-breaker state to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * @internal
 */
async function find<TType>(
    kysely: Kysely<KyselyCircuitBreakerStorageTables>,
    serde: ISerde<string>,
    key: string,
): Promise<TType | null> {
    const row = await kysely
        .selectFrom("circuitBreaker")
        .where("circuitBreaker.key", "=", key)
        .select("circuitBreaker.state")
        .executeTakeFirst();
    if (row === undefined) {
        return null;
    }
    return serde.deserialize<TType>(row.state);
}

/**
 * @internal
 */
class KyselyCircuitBreakerStorageAdapterTransaction<
    TType = unknown,
> implements ICircuitBreakerStorageAdapterTransaction<TType> {
    private readonly isMysql: boolean;

    constructor(
        private readonly kysely: Kysely<KyselyCircuitBreakerStorageTables>,
        private readonly serde: ISerde<string>,
    ) {
        this.isMysql =
            this.kysely.getExecutor().adapter instanceof MysqlAdapter;
    }

    async upsert(key: string, state: TType): Promise<void> {
        const serializedState = this.serde.serialize(state);
        await this.kysely
            .insertInto("circuitBreaker")
            .values({
                key,
                state: serializedState,
            })
            .$if(!this.isMysql, (eb) =>
                eb.onConflict((eb_) =>
                    eb_.column("key").doUpdateSet({
                        state: serializedState,
                    }),
                ),
            )
            .$if(this.isMysql, (eb) =>
                eb.onDuplicateKeyUpdate({
                    state: serializedState,
                }),
            )
            .execute();
    }

    async find(key: string): Promise<TType | null> {
        return find(this.kysely, this.serde, key);
    }
}

/**
 * To utilize the `KyselyCircuitBreakerStorageAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselyCircuitBreakerStorageAdapter` correctly, you need to use a database that has support for transactions.
 * This adapter is compatible and have been tested with:
 * - `Sqlite`
 * - `Postgres`
 * - `Mysql`
 * - `Mariadb`
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter"`
 * @group Adapters
 */
export class KyselyCircuitBreakerStorageAdapter<TType>
    implements ICircuitBreakerStorageAdapter, IInitizable, IDeinitizable
{
    private readonly transactionContext: ITransactionContext<
        Kysely<KyselyCircuitBreakerStorageTables>
    >;
    private readonly serde: ISerde<string>;

    /**
     * @example
     * ```ts
     * import { KyselyCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-storage-adapter";
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
     * const circuitBreakerStorageAdapter = new KyselyCircuitBreakerStorageAdapter({
     *   transactionContext,
     *   serde
     * });
     * // You need initialize the adapter once before using it.
     * await circuitBreakerStorageAdapter.init();
     * ```
     */
    constructor(settings: KyselyCircuitBreakerStorageAdapterSettings) {
        const { transactionContext, serde } = settings;

        this.transactionContext = transactionContext;
        this.serde = serde;
    }

    /**
     * Removes all related circuit breaker tables and their rows.
     * Note all circuit breaker data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropTable("circuitBreaker")
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
                .createTable("circuitBreaker")
                .addColumn("key", "varchar(255)", (col) =>
                    col.primaryKey().notNull(),
                )
                .addColumn("state", "varchar(255)", (col) => col.notNull())
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    async transaction<TValue>(
        fn: InvocableFn<
            [transaction: ICircuitBreakerStorageAdapterTransaction],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await this.transactionContext.run(async () => {
            return await fn(
                new KyselyCircuitBreakerStorageAdapterTransaction(
                    this.transactionContext.current,
                    this.serde,
                ),
            );
        });
    }

    async find(key: string): Promise<TType | null> {
        return find(this.transactionContext.current, this.serde, key);
    }

    async remove(key: string): Promise<void> {
        await this.transactionContext.current
            .deleteFrom("circuitBreaker")
            .where("circuitBreaker.key", "=", key)
            .execute();
    }
}
