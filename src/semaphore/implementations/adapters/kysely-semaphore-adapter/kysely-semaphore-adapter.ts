/**
 * @module Semaphore
 */

import { PostgresAdapter, sql } from "kysely";
import {
    jsonArrayFrom as jsonArrayFromPostgres,
    jsonBuildObject as jsonBuildObjectPostgres,
} from "kysely/helpers/postgres";
import {
    jsonArrayFrom as jsonArrayFromSqlite,
    jsonBuildObject as jsonBuildObjectSqlite,
} from "kysely/helpers/sqlite";

import { resolveTransactionAware } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type {
    Expression,
    ExpressionBuilder,
    Kysely,
    RawBuilder,
    SqlBool,
} from "kysely";

import type {
    ISemaphoreAdapter,
    ISemaphoreAdapterState,
    SemaphoreAcquireSettings,
} from "@/semaphore/contracts/_module-exports.js";
import type {
    ITransactionContext,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
    IAsyncPrunable,
} from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreSlotEntry = {
    id: string;
    // In ms since unix epoch
    expiration: number | null;
};

/**
 * Some sql database drivers (e.g. postgres) return json columns parsed while
 * others (e.g. sqlite) return them as strings.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreSlots = Array<KyselySemaphoreSlotEntry> | string;

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreEntryTable = {
    key: string;
    limit: number;
    slots: KyselySemaphoreSlots;
    // In ms since unix epoch. The row can be pruned after this date.
    // Stored as a 64 bit float, the closest sql type to a js number.
    expiration: number | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export type KyselySemaphoreTables = {
    semaphore: KyselySemaphoreEntryTable;
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
    database: TransactionAware<Kysely<KyselySemaphoreTables>>;
};

/**
 * To utilize the `KyselySemaphoreAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselySemaphoreAdapter` correctly, ensure you use a single, consistent database across all server instances.
 * Every operation is a single sql statement, so the adapter does not require transactions to stay consistent.
 * The adapter have been tested with `sqlite` and `postgres` databases.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/kysely-semaphore-adapter"`
 * @group Adapters
 */
export class KyselySemaphoreAdapter
    implements
        ISemaphoreAdapter,
        IAsyncDeinitizable,
        IAsyncInitizable,
        IAsyncPrunable
{
    private static toSlots(
        slots: KyselySemaphoreSlots,
    ): Array<KyselySemaphoreSlotEntry> {
        if (typeof slots === "string") {
            return JSON.parse(slots) as Array<KyselySemaphoreSlotEntry>;
        }
        return slots;
    }

    private static isSlotNotExpired(
        slot: KyselySemaphoreSlotEntry,
        now: number,
    ): boolean {
        return slot.expiration === null || slot.expiration > now;
    }

    private readonly trxCtx: Pick<
        ITransactionContext<Kysely<KyselySemaphoreTables>>,
        "client" | "current"
    >;
    private readonly isPostgres: boolean;

    constructor(settings: KyselySemaphoreAdapterSettings) {
        const { database } = settings;
        this.trxCtx = resolveTransactionAware(database);
        this.isPostgres =
            this.trxCtx.client.getExecutor().adapter instanceof PostgresAdapter;
    }

    private slotsTable() {
        const slots: RawBuilder<unknown> = this.isPostgres
            ? sql`jsonb_array_elements(${sql.ref("semaphore.slots")}) WITH ORDINALITY`
            : sql`json_each(${sql.ref("semaphore.slots")})`;
        return this.trxCtx.current.selectFrom(slots.as("slot"));
    }

    private slotIdExpression(): RawBuilder<string> {
        if (this.isPostgres) {
            return sql<string>`slot.value->>'id'`;
        }
        return sql<string>`json_extract(slot.value, '$.id')`;
    }

    private slotExpirationExpression(): RawBuilder<number | null> {
        if (this.isPostgres) {
            return sql<
                number | null
            >`(slot.value->>'expiration')::double precision`;
        }
        return sql<number | null>`json_extract(slot.value, '$.expiration')`;
    }

    private slotIndexExpression(): RawBuilder<number> {
        if (this.isPostgres) {
            return sql<number>`slot.ordinality`;
        }
        return sql<number>`slot.key`;
    }

    private jsonArrayLength(slots: RawBuilder<unknown>): RawBuilder<number> {
        if (this.isPostgres) {
            return sql<number>`jsonb_array_length(${slots})`;
        }
        return sql<number>`json_array_length(${slots})`;
    }

    private textValue(value: string): RawBuilder<string> {
        if (this.isPostgres) {
            return sql<string>`${value}::text`;
        }
        return sql<string>`${value}`;
    }

    private integerValue(value: number): RawBuilder<number> {
        if (this.isPostgres) {
            return sql<number>`${value}::integer`;
        }
        return sql<number>`${value}`;
    }

    private floatValue(value: number | null): RawBuilder<number | null> {
        if (this.isPostgres) {
            return sql<number | null>`${value}::double precision`;
        }
        return sql<number | null>`${value}`;
    }

    private slotsArray(
        query: Parameters<typeof jsonArrayFromSqlite>[0],
    ): RawBuilder<KyselySemaphoreSlots> {
        if (this.isPostgres) {
            return sql<KyselySemaphoreSlots>`${jsonArrayFromPostgres(query)}::jsonb`;
        }
        return jsonArrayFromSqlite(
            query,
        ) as unknown as RawBuilder<KyselySemaphoreSlots>;
    }

    private slotObject(slot: {
        id: string;
        expiration: number | null;
    }): RawBuilder<unknown> {
        const values = {
            id: this.textValue(slot.id),
            expiration: this.floatValue(slot.expiration),
        };
        if (this.isPostgres) {
            return jsonBuildObjectPostgres(values);
        }
        return jsonBuildObjectSqlite(values);
    }

    private appendSlot(
        slots: RawBuilder<unknown>,
        slot: RawBuilder<unknown>,
    ): RawBuilder<KyselySemaphoreSlots> {
        if (this.isPostgres) {
            return sql<KyselySemaphoreSlots>`${slots} || jsonb_build_array(${slot})`;
        }
        return sql<KyselySemaphoreSlots>`json_insert(${slots}, '$[#]', ${slot})`;
    }

    private slotNotExpiredCondition<TDatabase, TTable extends keyof TDatabase>(
        eb: ExpressionBuilder<TDatabase, TTable>,
        now: number,
    ): Expression<SqlBool> {
        const expiration = this.slotExpirationExpression();
        return eb.or([eb(expiration, "is", null), eb(expiration, ">", now)]);
    }

    private unexpiredSlotCondition<TDatabase, TTable extends keyof TDatabase>(
        eb: ExpressionBuilder<TDatabase, TTable>,
        slotId: string,
        now: number,
    ): Expression<SqlBool> {
        return eb.and([
            eb(this.slotIdExpression(), "=", slotId),
            this.slotNotExpiredCondition(eb, now),
        ]);
    }

    private unexpiredExpirableSlotCondition<
        TDatabase,
        TTable extends keyof TDatabase,
    >(
        eb: ExpressionBuilder<TDatabase, TTable>,
        slotId: string,
        now: number,
    ): Expression<SqlBool> {
        const expiration = this.slotExpirationExpression();
        return eb.and([
            eb(this.slotIdExpression(), "=", slotId),
            eb(expiration, "is not", null),
            eb(expiration, ">", now),
        ]);
    }

    private unexpiredSlotRows(now: number) {
        return this.slotsTable()
            .select([
                this.slotIdExpression().as("id"),
                this.slotExpirationExpression().as("expiration"),
            ])
            .where((eb) => this.slotNotExpiredCondition(eb, now))
            .orderBy(this.slotIndexExpression());
    }

    /**
     * The expiration of the row is the expiration of the latest slot while at
     * least one slot is acquired. A row without acquired slots expires
     * immediately.
     */
    private expirationValue(
        slots: Expression<unknown>,
        now: number,
    ): RawBuilder<number | null> {
        if (this.isPostgres) {
            return sql<number | null>`case
                when jsonb_array_length(${slots}) = 0 then ${now - 60000}
                when exists (select 1 from jsonb_array_elements(${slots}) as s where s->>'expiration' is null) then null
                else (select max((s->>'expiration')::double precision) from jsonb_array_elements(${slots}) as s)
            end`;
        }
        return sql<number | null>`case
            when json_array_length(${slots}) = 0 then ${now - 60000}
            when exists (select 1 from json_each(${slots}) as s where json_extract(s.value, '$.expiration') is null) then null
            else (select max(json_extract(s.value, '$.expiration')) from json_each(${slots}) as s)
        end`;
    }

    private refreshedSlotRows(slotId: string, ttl: number, now: number) {
        return this.slotsTable()
            .select((eb) => [
                this.slotIdExpression().as("id"),
                eb
                    .case()
                    .when(eb(this.slotIdExpression(), "=", slotId))
                    .then(this.floatValue(ttl))
                    .else(this.slotExpirationExpression())
                    .end()
                    .as("expiration"),
            ])
            .where((eb) => this.slotNotExpiredCondition(eb, now))
            .orderBy(this.slotIndexExpression());
    }

    private unexpiredSlotQuery(slotId: string, now: number) {
        return this.slotsTable()
            .select(sql`1`.as("one"))
            .where((eb) => this.unexpiredSlotCondition(eb, slotId, now));
    }

    private unexpiredExpirableSlotQuery(slotId: string, now: number) {
        return this.slotsTable()
            .select(sql`1`.as("one"))
            .where((eb) =>
                this.unexpiredExpirableSlotCondition(eb, slotId, now),
            );
    }

    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .createTable("semaphore")
                .addColumn("key", "varchar(255)", (col) =>
                    col.notNull().primaryKey(),
                )
                .addColumn("limit", "integer", (col) => col.notNull())
                .addColumn("slots", this.isPostgres ? "jsonb" : "json", (col) =>
                    col.notNull(),
                )
                .addColumn(
                    "expiration",
                    this.isPostgres ? "double precision" : "real",
                )
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .createIndex("semaphore_expiration")
                .on("semaphore")
                .column("expiration")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes the semaphore table and its rows.
     * Note all semaphore data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .dropIndex("semaphore_expiration")
                .on("semaphore")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema.dropTable("semaphore").execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.trxCtx.current
            .deleteFrom("semaphore")
            .where("semaphore.expiration", "<=", Date.now())
            .execute();
    }

    async acquire(settings: SemaphoreAcquireSettings): Promise<boolean> {
        const { key, slotId, limit, ttl } = settings;
        const now = Date.now();
        const expiration = ttl?.getTime() ?? null;
        const insertedSlots = this.slotsArray(
            this.trxCtx.current.selectNoFrom([
                this.textValue(slotId).as("id"),
                this.floatValue(expiration).as("expiration"),
            ]),
        );

        const semaphore = await this.trxCtx.current
            .insertInto("semaphore")
            .values({
                key,
                limit,
                slots: insertedSlots,
                expiration: this.expirationValue(insertedSlots, now),
            })
            .onConflict((oc) =>
                oc.column("key").doUpdateSet((eb) => {
                    const unexpiredSlots = this.slotsArray(
                        this.unexpiredSlotRows(now),
                    );

                    // When no slots are held the limit may be updated, otherwise
                    // the stored limit is authoritative.
                    const nextLimit = eb
                        .case()
                        .when(eb(this.jsonArrayLength(unexpiredSlots), "=", 0))
                        .then(this.integerValue(limit))
                        .else(eb.ref("semaphore.limit"))
                        .end() as Expression<number>;

                    const shouldAppendSlot = eb.and([
                        eb(
                            this.jsonArrayLength(unexpiredSlots),
                            "<",
                            nextLimit,
                        ),
                        eb.not(eb.exists(this.unexpiredSlotQuery(slotId, now))),
                    ]);

                    const nextSlots = eb
                        .case()
                        .when(shouldAppendSlot)
                        .then(
                            this.appendSlot(
                                unexpiredSlots,
                                this.slotObject({ id: slotId, expiration }),
                            ),
                        )
                        .else(unexpiredSlots)
                        .end() as Expression<KyselySemaphoreSlots>;

                    return {
                        limit: nextLimit,
                        slots: nextSlots,
                        expiration: this.expirationValue(nextSlots, now),
                    };
                }),
            )
            .returning(["semaphore.key", "semaphore.slots"])
            .executeTakeFirst();

        if (semaphore === undefined) {
            return false;
        }

        return KyselySemaphoreAdapter.toSlots(semaphore.slots).some(
            (slot) => slot.id === slotId,
        );
    }

    async release(key: string, slotId: string): Promise<boolean> {
        const now = Date.now();
        const semaphore = await this.trxCtx.current
            .updateTable("semaphore")
            .set((eb) => {
                const nextSlots = this.slotsArray(
                    this.unexpiredSlotRows(now).where(
                        eb(this.slotIdExpression(), "<>", slotId),
                    ),
                );
                return {
                    slots: nextSlots,
                    expiration: this.expirationValue(nextSlots, now),
                };
            })
            .where("semaphore.key", "=", key)
            .where((eb) => eb.exists(this.unexpiredSlotQuery(slotId, now)))
            .returning("semaphore.key")
            .executeTakeFirst();

        return semaphore !== undefined;
    }

    async forceReleaseAll(key: string): Promise<boolean> {
        const semaphore = await this.trxCtx.current
            .deleteFrom("semaphore")
            .where("semaphore.key", "=", key)
            .returning("semaphore.slots")
            .executeTakeFirst();

        if (semaphore === undefined) {
            return false;
        }

        const now = Date.now();
        return KyselySemaphoreAdapter.toSlots(semaphore.slots).some((slot) =>
            KyselySemaphoreAdapter.isSlotNotExpired(slot, now),
        );
    }

    async refresh(key: string, slotId: string, ttl: Date): Promise<boolean> {
        const now = Date.now();
        const semaphore = await this.trxCtx.current
            .updateTable("semaphore")
            .set(() => {
                const nextSlots = this.slotsArray(
                    this.refreshedSlotRows(slotId, ttl.getTime(), now),
                );
                return {
                    slots: nextSlots,
                    expiration: this.expirationValue(nextSlots, now),
                };
            })
            .where("semaphore.key", "=", key)
            .where((eb) =>
                eb.exists(this.unexpiredExpirableSlotQuery(slotId, now)),
            )
            .returning("semaphore.key")
            .executeTakeFirst();

        return semaphore !== undefined;
    }

    async getState(key: string): Promise<ISemaphoreAdapterState | null> {
        const semaphore = await this.trxCtx.current
            .selectFrom("semaphore")
            .where("semaphore.key", "=", key)
            .select(["semaphore.limit", "semaphore.slots"])
            .executeTakeFirst();

        if (semaphore === undefined) {
            return null;
        }

        const now = Date.now();
        const unexpiredSlots = KyselySemaphoreAdapter.toSlots(
            semaphore.slots,
        ).filter((slot) => KyselySemaphoreAdapter.isSlotNotExpired(slot, now));
        if (unexpiredSlots.length === 0) {
            return null;
        }

        const acquiredSlots = new Map<string, Date | null>();
        for (const slot of unexpiredSlots) {
            if (slot.expiration === null) {
                acquiredSlots.set(slot.id, null);
            } else {
                acquiredSlots.set(slot.id, new Date(slot.expiration));
            }
        }

        return {
            limit: semaphore.limit,
            acquiredSlots,
        };
    }
}
