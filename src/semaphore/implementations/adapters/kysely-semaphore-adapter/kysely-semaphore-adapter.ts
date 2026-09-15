/**
 * @module Semaphore
 */

import { MysqlAdapter } from "kysely";

import type { Kysely } from "kysely";

import type {
    ISemaphoreAdapter,
    ISemaphoreAdapterState,
    SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    IPrunable,
} from "@/utilities/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreTable = {
    key: string;
    limit: number;
};

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreSlotTable = {
    id: string;
    key: string;
    // In ms since unix epoch
    // The type in mysql is bigint and will be returned as a string
    expiration: number | string | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreTables = {
    semaphore: KyselySemaphoreTable;
    semaphoreSlot: KyselySemaphoreSlotTable;
};

/**
 * Configuration for `KyselySemaphoreAdapter`.
 * Requires a Kysely instance typed with the semaphore schema.
 * Call `init()` before using the adapter.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreAdapterSettings = {
    /**
     * The `TransactionContext` used to store semaphore state.
     *
     * The adapter is transaction aware: its operations run inside the context's active transaction. Adapters given the same instance share the same transaction.
     */
    transactionContext: ITransactionContext<Kysely<KyselySemaphoreTables>>;
};

/**
 * To utilize the `KyselySemaphoreAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselySemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances and use a database that has support for transactions.
 * The adapter have been tested with `sqlite`, `postgres` and `mysql` databases.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export class KyselySemaphoreAdapter
    implements ISemaphoreAdapter, IDeinitizable, IInitizable, IPrunable
{
    private readonly transactionContext: ITransactionContext<
        Kysely<KyselySemaphoreTables>
    >;
    private readonly isMysql: boolean;

    /**
     * @example
     * ```ts
     * import { KyselySemaphoreAdapter } from "eridu-tech/semaphore/kysely-semaphore-adapter";
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
     * const semaphoreAdapter = new KyselySemaphoreAdapter({
     *   transactionContext,
     * });
     * // You need initialize the adapter once before using it.
     * await semaphoreAdapter.init();
     * ```
     */
    constructor(settings: KyselySemaphoreAdapterSettings) {
        const { transactionContext } = settings;
        this.transactionContext = transactionContext;
        this.isMysql =
            this.transactionContext.client.getExecutor().adapter instanceof
            MysqlAdapter;
    }

    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .createTable("semaphore")
                .addColumn("key", "varchar(255)", (col) =>
                    col.notNull().primaryKey(),
                )
                .addColumn("limit", "integer", (col) => col.notNull())
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .createTable("semaphoreSlot")
                .addColumn("id", "varchar(255)", (col) =>
                    col.notNull().primaryKey(),
                )
                .addColumn("key", "varchar(255)", (col) => col.notNull())
                .addColumn("expiration", "bigint")
                .addForeignKeyConstraint(
                    "semaphoreSlot_key",
                    ["key"],
                    "semaphore",
                    ["key"],
                    (eb) => eb.onDelete("cascade"),
                )
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .createIndex("semaphoreSlot_expiration_index")
                .on("semaphoreSlot")
                .columns(["key", "expiration"])
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes all related semaphore tables and their rows.
     * Note all semaphore data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropIndex("semaphoreSlot_expiration_index")
                .on("semaphoreSlot")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropTable("semaphoreSlot")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.transactionContext.client.schema
                .dropTable("semaphore")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.transactionContext.client
            .deleteFrom("semaphore")
            .where((eb) => {
                const hasUnexpiredSlots = eb
                    .selectFrom("semaphoreSlot")
                    .select(eb.val(1).as("value"))
                    .where("semaphoreSlot.key", "=", eb.ref("semaphore.key"))
                    .where((eb_) =>
                        eb_.and([
                            eb_("semaphoreSlot.expiration", "is not", null),
                            eb_("semaphoreSlot.expiration", ">", Date.now()),
                        ]),
                    );
                return eb.not(eb.exists(hasUnexpiredSlots));
            })
            .execute();
    }

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;

        return await this.transactionContext.run(async () => {
            // Create the semaphore if it doesn't exist (never overwrite limit
            // when slots are still held — the stored limit governs admission).
            await this.transactionContext.current
                .insertInto("semaphore")
                .values({ key, limit })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((eb_) => eb_.column("key").doNothing()),
                )
                .$if(this.isMysql, (eb) => eb.onDuplicateKeyUpdate({ key }))
                .execute();

            // Read the stored semaphore to get the authoritative limit.
            const semaphore = await this.transactionContext.current
                .selectFrom("semaphore")
                .where("semaphore.key", "=", key)
                .select("semaphore.limit")
                .executeTakeFirst();

            if (!semaphore) {
                return false;
            }

            // Count current non-expired slots.
            const countResult = await this.transactionContext.current
                .selectFrom("semaphoreSlot")
                .where("semaphoreSlot.key", "=", key)
                .where((eb) =>
                    eb.or([
                        eb("semaphoreSlot.expiration", "is", null),
                        eb("semaphoreSlot.expiration", ">", Date.now()),
                    ]),
                )
                .select((eb) => eb.fn.countAll().as("count"))
                .executeTakeFirst();

            const currentCount = Number(countResult?.count ?? 0);

            // When no slots are held the limit may be updated; otherwise the
            // stored limit is authoritative.
            const effectiveLimit = currentCount === 0 ? limit : semaphore.limit;

            if (currentCount >= effectiveLimit) {
                return false;
            }

            // Update the stored limit when the caller provides a new one
            // and no slots are held.
            if (currentCount === 0 && limit !== semaphore.limit) {
                await this.transactionContext.current
                    .updateTable("semaphore")
                    .where("semaphore.key", "=", key)
                    .set({ limit })
                    .execute();
            }

            // Upsert the slot
            const expiration = ttl?.getTime() ?? null;
            await this.transactionContext.current
                .insertInto("semaphoreSlot")
                .values({ key, id: slotId, expiration })
                .$if(!this.isMysql, (eb) =>
                    eb.onConflict((eb_) =>
                        eb_
                            .column("id")
                            .doUpdateSet({ key, id: slotId, expiration }),
                    ),
                )
                .$if(this.isMysql, (eb) =>
                    eb.onDuplicateKeyUpdate({ key, id: slotId, expiration }),
                )
                .execute();

            return true;
        });
    }

    async release(key: string, slotId: string): Promise<boolean> {
        if (this.isMysql) {
            return await this.transactionContext.run(async () => {
                const existing = await this.transactionContext.current
                    .selectFrom("semaphoreSlot")
                    .where("semaphoreSlot.key", "=", key)
                    .where("semaphoreSlot.id", "=", slotId)
                    .where((eb) =>
                        eb.or([
                            eb("semaphoreSlot.expiration", "is", null),
                            eb("semaphoreSlot.expiration", ">", Date.now()),
                        ]),
                    )
                    .select("semaphoreSlot.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await this.transactionContext.current
                    .deleteFrom("semaphoreSlot")
                    .where("semaphoreSlot.key", "=", key)
                    .where("semaphoreSlot.id", "=", slotId)
                    .execute();

                return true;
            });
        }

        const result = await this.transactionContext.current
            .deleteFrom("semaphoreSlot")
            .where("semaphoreSlot.key", "=", key)
            .where("semaphoreSlot.id", "=", slotId)
            .where((eb) =>
                eb.or([
                    eb("semaphoreSlot.expiration", "is", null),
                    eb("semaphoreSlot.expiration", ">", Date.now()),
                ]),
            )
            .returning("semaphoreSlot.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async forceReleaseAll(key: string): Promise<boolean> {
        if (this.isMysql) {
            return await this.transactionContext.run(async () => {
                const existing = await this.transactionContext.current
                    .selectFrom("semaphoreSlot")
                    .where("semaphoreSlot.key", "=", key)
                    .where((eb) =>
                        eb.or([
                            eb("semaphoreSlot.expiration", "is", null),
                            eb("semaphoreSlot.expiration", ">", Date.now()),
                        ]),
                    )
                    .select("semaphoreSlot.id")
                    .executeTakeFirst();

                if (!existing) {
                    return false;
                }

                await this.transactionContext.current
                    .deleteFrom("semaphoreSlot")
                    .where("semaphoreSlot.key", "=", key)
                    .execute();

                return true;
            });
        }

        const result = await this.transactionContext.current
            .deleteFrom("semaphoreSlot")
            .where("semaphoreSlot.key", "=", key)
            .where((eb) =>
                eb.or([
                    eb("semaphoreSlot.expiration", "is", null),
                    eb("semaphoreSlot.expiration", ">", Date.now()),
                ]),
            )
            .returning("semaphoreSlot.id")
            .executeTakeFirst();

        return result !== undefined;
    }

    async refresh(key: string, slotId: string, ttl: Date): Promise<boolean> {
        const expiration = ttl.getTime();
        const result = await this.transactionContext.current
            .updateTable("semaphoreSlot")
            .where("semaphoreSlot.key", "=", key)
            .where("semaphoreSlot.id", "=", slotId)
            .where((eb) =>
                eb.and([
                    eb("semaphoreSlot.expiration", "is not", null),
                    eb("semaphoreSlot.expiration", ">", Date.now()),
                ]),
            )
            .set({ expiration })
            .execute();

        return Number(result[0]?.numUpdatedRows ?? 0n) > 0;
    }

    async getState(key: string): Promise<ISemaphoreAdapterState | null> {
        const semaphore = await this.transactionContext.current
            .selectFrom("semaphore")
            .where("semaphore.key", "=", key)
            .select("semaphore.limit")
            .executeTakeFirst();

        if (semaphore === undefined) {
            return null;
        }

        const slots = await this.transactionContext.current
            .selectFrom("semaphoreSlot")
            .where("semaphoreSlot.key", "=", key)
            .select(["semaphoreSlot.id", "semaphoreSlot.expiration"])
            .execute();

        const acquiredSlots = new Map<string, Date | null>();
        for (const slot of slots) {
            if (
                slot.expiration !== null &&
                Number(slot.expiration) <= Date.now()
            ) {
                continue;
            }
            acquiredSlots.set(
                slot.id,
                slot.expiration === null
                    ? null
                    : new Date(Number(slot.expiration)),
            );
        }

        // Return null when there are no non-expired slots — the semaphore
        // is effectively dead and should appear as non-existent.
        if (acquiredSlots.size === 0) {
            return null;
        }

        return {
            limit: semaphore.limit,
            acquiredSlots,
        };
    }
}
