/**
 * @module SharedLock
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
    IReaderSemaphoreAdapterState,
    ISharedLockAdapter,
    ISharedLockAdapterState,
    IWriterLockAdapterState,
    SharedLockAcquireSettings,
} from "@/shared-lock/contracts/_module-exports.js";
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
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselyWriterLockEntry = {
    owner: string;
    // In ms since unix epoch
    expiration: number | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselyReaderSemaphoreSlotEntry = {
    id: string;
    // In ms since unix epoch
    expiration: number | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselyReaderSemaphoreEntry = {
    limit: number;
    slots: Array<KyselyReaderSemaphoreSlotEntry>;
};

/**
 * Some sql database drivers (e.g. postgres) return json columns parsed while
 * others (e.g. sqlite) return them as strings.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselySharedLockTable = {
    key: string;
    // Null when no writer lock is held.
    writerLock: KyselyWriterLockEntry | string | null;
    // Null when no reader semaphore exists.
    readerSemaphore: KyselyReaderSemaphoreEntry | string | null;
    // In ms since unix epoch. The row can be pruned after this date.
    // Stored as a 64 bit float, the closest sql type to a js number.
    expiration: number | null;
};

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselySharedLockTables = {
    sharedLock: KyselySharedLockTable;
};

/**
 * Configuration for `KyselySharedLockAdapter`.
 * Requires a Kysely instance typed with the shared-lock schema.
 * Call `init()` before using the adapter.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export type KyselySharedLockAdapterSettings = {
    database: TransactionAware<Kysely<KyselySharedLockTables>>;
};

/**
 * To utilize the `KyselySharedLockAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselySharedLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 * Every operation is a single sql statement, so the adapter does not require transactions to stay consistent.
 * The adapter have been tested with `sqlite` and `postgres` databases.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/kysely-shared-lock-adapter"`
 * @group Adapters
 */
export class KyselySharedLockAdapter
    implements
        ISharedLockAdapter,
        IAsyncDeinitizable,
        IAsyncInitizable,
        IAsyncPrunable
{
    private static toWriterLock(
        writerLock: KyselyWriterLockEntry | string | null,
    ): KyselyWriterLockEntry | null {
        if (writerLock === null) {
            return null;
        }
        if (typeof writerLock === "string") {
            return JSON.parse(writerLock) as KyselyWriterLockEntry;
        }
        return writerLock;
    }

    private static toReaderSemaphore(
        readerSemaphore: KyselyReaderSemaphoreEntry | string | null,
    ): KyselyReaderSemaphoreEntry | null {
        if (readerSemaphore === null) {
            return null;
        }
        if (typeof readerSemaphore === "string") {
            return JSON.parse(readerSemaphore) as KyselyReaderSemaphoreEntry;
        }
        return readerSemaphore;
    }

    private static isSlotNotExpired(
        slot: KyselyReaderSemaphoreSlotEntry,
        now: number,
    ): boolean {
        return slot.expiration === null || slot.expiration > now;
    }

    private static isWriterNotExpired(
        writerLock: KyselyWriterLockEntry,
        now: number,
    ): boolean {
        return writerLock.expiration === null || writerLock.expiration > now;
    }

    private readonly trxCtx: Pick<
        ITransactionContext<Kysely<KyselySharedLockTables>>,
        "client" | "current"
    >;
    private readonly isPostgres: boolean;

    constructor(settings: KyselySharedLockAdapterSettings) {
        const { database } = settings;
        this.trxCtx = resolveTransactionAware(database);
        this.isPostgres =
            this.trxCtx.client.getExecutor().adapter instanceof PostgresAdapter;
    }

    private writerLockRef(): RawBuilder<unknown> {
        return sql.ref("sharedLock.writerLock");
    }

    private readerSemaphoreRef(): RawBuilder<unknown> {
        return sql.ref("sharedLock.readerSemaphore");
    }

    private writerOwnerExpression(): RawBuilder<string | null> {
        return this.isPostgres
            ? sql<string | null>`${this.writerLockRef()}->>'owner'`
            : sql<
                  string | null
              >`json_extract(${this.writerLockRef()}, '$.owner')`;
    }

    private writerExpirationExpression(): RawBuilder<number | null> {
        return this.isPostgres
            ? sql<
                  number | null
              >`(${this.writerLockRef()}->>'expiration')::double precision`
            : sql<
                  number | null
              >`json_extract(${this.writerLockRef()}, '$.expiration')`;
    }

    private readerLimitExpression(): RawBuilder<number | null> {
        return this.isPostgres
            ? sql<
                  number | null
              >`(${this.readerSemaphoreRef()}->>'limit')::integer`
            : sql<
                  number | null
              >`json_extract(${this.readerSemaphoreRef()}, '$.limit')`;
    }

    private slotsTable() {
        const slots: RawBuilder<unknown> = this.isPostgres
            ? sql`jsonb_array_elements(${this.readerSemaphoreRef()}->'slots') WITH ORDINALITY`
            : sql`json_each(${this.readerSemaphoreRef()}, '$.slots')`;
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
    ): RawBuilder<Array<KyselyReaderSemaphoreSlotEntry>> {
        if (this.isPostgres) {
            return sql<
                Array<KyselyReaderSemaphoreSlotEntry>
            >`${jsonArrayFromPostgres(query)}::jsonb`;
        }
        return jsonArrayFromSqlite(query) as unknown as RawBuilder<
            Array<KyselyReaderSemaphoreSlotEntry>
        >;
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
    ): RawBuilder<Array<KyselyReaderSemaphoreSlotEntry>> {
        if (this.isPostgres) {
            return sql<
                Array<KyselyReaderSemaphoreSlotEntry>
            >`${slots} || jsonb_build_array(${slot})`;
        }
        return sql<
            Array<KyselyReaderSemaphoreSlotEntry>
        >`json_insert(${slots}, '$[#]', ${slot})`;
    }

    private insertedSlots(
        slotId: string,
        expiration: number | null,
    ): RawBuilder<Array<KyselyReaderSemaphoreSlotEntry>> {
        return this.slotsArray(
            this.trxCtx.current.selectNoFrom([
                this.textValue(slotId).as("id"),
                this.floatValue(expiration).as("expiration"),
            ]),
        );
    }

    private writerLockValue(
        owner: string,
        expiration: number | null,
    ): RawBuilder<KyselyWriterLockEntry> {
        if (this.isPostgres) {
            return sql<KyselyWriterLockEntry>`jsonb_build_object('owner', ${this.textValue(owner)}, 'expiration', ${this.floatValue(expiration)})`;
        }
        return sql<KyselyWriterLockEntry>`json_object('owner', ${this.textValue(owner)}, 'expiration', ${this.floatValue(expiration)})`;
    }

    private refreshedWriterLock(
        ttl: number,
    ): RawBuilder<KyselyWriterLockEntry> {
        if (this.isPostgres) {
            return sql<KyselyWriterLockEntry>`jsonb_set(${this.writerLockRef()}, '{expiration}', to_jsonb(${this.floatValue(ttl)}))`;
        }
        return sql<KyselyWriterLockEntry>`json_set(${this.writerLockRef()}, '$.expiration', ${ttl})`;
    }

    private readerSemaphoreValue(
        limit: Expression<unknown>,
        slots: Expression<unknown>,
    ): RawBuilder<KyselyReaderSemaphoreEntry> {
        if (this.isPostgres) {
            return sql<KyselyReaderSemaphoreEntry>`jsonb_build_object('limit', ${limit}, 'slots', ${slots})`;
        }
        return sql<KyselyReaderSemaphoreEntry>`json_object('limit', ${limit}, 'slots', json(${slots}))`;
    }

    /**
     * The expiration of the row is the expiration of the writer lock while a
     * writer is held, and of the latest reader slot while a reader semaphore is
     * held. A row without active writer or readers expires immediately.
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

    private writerActiveCondition<TDatabase, TTable extends keyof TDatabase>(
        eb: ExpressionBuilder<TDatabase, TTable>,
        now: number,
    ): Expression<SqlBool> {
        const owner = this.writerOwnerExpression();
        const expiration = this.writerExpirationExpression();
        return eb.and([
            eb(owner, "is not", null),
            eb.or([eb(expiration, "is", null), eb(expiration, ">", now)]),
        ]);
    }

    private writerAcquirableCondition<
        TDatabase,
        TTable extends keyof TDatabase,
    >(
        eb: ExpressionBuilder<TDatabase, TTable>,
        lockId: string,
        now: number,
    ): Expression<SqlBool> {
        const owner = this.writerOwnerExpression();
        const expiration = this.writerExpirationExpression();
        return eb.or([
            eb(owner, "is", null),
            eb(expiration, "<=", now),
            eb(owner, "=", lockId),
        ]);
    }

    private writerNotExpiredCondition<
        TDatabase,
        TTable extends keyof TDatabase,
    >(
        eb: ExpressionBuilder<TDatabase, TTable>,
        now: number,
    ): Expression<SqlBool> {
        const expiration = this.writerExpirationExpression();
        return eb.or([eb(expiration, "is", null), eb(expiration, ">", now)]);
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

    private unexpiredSlotsQuery(now: number) {
        return this.slotsTable()
            .select(sql`1`.as("one"))
            .where((eb) => this.slotNotExpiredCondition(eb, now));
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
                .createTable("sharedLock")
                .addColumn("key", "varchar(255)", (col) =>
                    col.notNull().primaryKey(),
                )
                .addColumn("writerLock", this.isPostgres ? "jsonb" : "json")
                .addColumn(
                    "readerSemaphore",
                    this.isPostgres ? "jsonb" : "json",
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
                .createIndex("sharedLock_expiration")
                .on("sharedLock")
                .column("expiration")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes the shared-lock table and its rows.
     * Note all shared-lock data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .dropIndex("sharedLock_expiration")
                .on("sharedLock")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema.dropTable("sharedLock").execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.trxCtx.current
            .deleteFrom("sharedLock")
            .where("sharedLock.expiration", "<=", Date.now())
            .execute();
    }

    async acquireWriter(
        key: string,
        lockId: string,
        ttl: Date | null,
    ): Promise<boolean> {
        const now = Date.now();
        const expiration = ttl?.getTime() ?? null;
        const writerLock = this.writerLockValue(lockId, expiration);

        const writer = await this.trxCtx.current
            .insertInto("sharedLock")
            .values({
                key,
                writerLock,
                readerSemaphore: null,
                expiration,
            })
            .onConflict((oc) =>
                oc
                    .column("key")
                    .doUpdateSet({ writerLock, expiration })
                    .where((eb) =>
                        eb.and([
                            this.writerAcquirableCondition(eb, lockId, now),
                            eb.not(eb.exists(this.unexpiredSlotsQuery(now))),
                        ]),
                    ),
            )
            .returning("sharedLock.key")
            .executeTakeFirst();

        return writer !== undefined;
    }

    async releaseWriter(key: string, lockId: string): Promise<boolean> {
        const now = Date.now();
        const writer = await this.trxCtx.current
            .deleteFrom("sharedLock")
            .where("sharedLock.key", "=", key)
            .where((eb) =>
                eb.and([
                    eb(this.writerOwnerExpression(), "=", lockId),
                    this.writerNotExpiredCondition(eb, now),
                ]),
            )
            .returning("sharedLock.key")
            .executeTakeFirst();

        return writer !== undefined;
    }

    async refreshWriter(
        key: string,
        lockId: string,
        ttl: Date,
    ): Promise<boolean> {
        const now = Date.now();
        const writer = await this.trxCtx.current
            .updateTable("sharedLock")
            .set({
                writerLock: this.refreshedWriterLock(ttl.getTime()),
                expiration: ttl.getTime(),
            })
            .where("sharedLock.key", "=", key)
            .where((eb) =>
                eb.and([
                    eb(this.writerOwnerExpression(), "=", lockId),
                    eb(this.writerExpirationExpression(), "is not", null),
                    eb(this.writerExpirationExpression(), ">", now),
                ]),
            )
            .returning("sharedLock.key")
            .executeTakeFirst();

        return writer !== undefined;
    }

    async acquireReader(settings: SharedLockAcquireSettings): Promise<boolean> {
        const { key, lockId, limit, ttl } = settings;
        const now = Date.now();
        const expiration = ttl?.getTime() ?? null;
        const insertedSlots = this.insertedSlots(lockId, expiration);

        const reader = await this.trxCtx.current
            .insertInto("sharedLock")
            .values({
                key,
                writerLock: null,
                readerSemaphore: this.readerSemaphoreValue(
                    this.integerValue(limit),
                    insertedSlots,
                ),
                expiration: this.expirationValue(insertedSlots, now),
            })
            .onConflict((oc) =>
                oc
                    .column("key")
                    .doUpdateSet((eb) => {
                        const unexpiredSlots = this.slotsArray(
                            this.unexpiredSlotRows(now),
                        );

                        // When no slots are held the limit may be updated,
                        // otherwise the stored limit is authoritative.
                        const nextLimit = eb
                            .case()
                            .when(
                                eb(
                                    this.jsonArrayLength(unexpiredSlots),
                                    "=",
                                    0,
                                ),
                            )
                            .then(this.integerValue(limit))
                            .else(this.readerLimitExpression())
                            .end() as Expression<number>;

                        const shouldAppendSlot = eb.and([
                            eb(
                                this.jsonArrayLength(unexpiredSlots),
                                "<",
                                nextLimit,
                            ),
                            eb.not(
                                eb.exists(this.unexpiredSlotQuery(lockId, now)),
                            ),
                        ]);

                        const nextSlots = eb
                            .case()
                            .when(shouldAppendSlot)
                            .then(
                                this.appendSlot(
                                    unexpiredSlots,
                                    this.slotObject({ id: lockId, expiration }),
                                ),
                            )
                            .else(unexpiredSlots)
                            .end() as Expression<
                            Array<KyselyReaderSemaphoreSlotEntry>
                        >;

                        return {
                            readerSemaphore: this.readerSemaphoreValue(
                                nextLimit,
                                nextSlots,
                            ),
                            expiration: this.expirationValue(nextSlots, now),
                        };
                    })
                    .where((eb) => eb.not(this.writerActiveCondition(eb, now))),
            )
            .returning("sharedLock.readerSemaphore")
            .executeTakeFirst();

        if (reader === undefined) {
            return false;
        }

        const readerSemaphore = KyselySharedLockAdapter.toReaderSemaphore(
            reader.readerSemaphore,
        );
        return (
            readerSemaphore !== null &&
            readerSemaphore.slots.some((slot) => slot.id === lockId)
        );
    }

    async releaseReader(key: string, slotId: string): Promise<boolean> {
        const now = Date.now();
        const reader = await this.trxCtx.current
            .updateTable("sharedLock")
            .set((eb) => {
                const nextSlots = this.slotsArray(
                    this.unexpiredSlotRows(now).where(
                        eb(this.slotIdExpression(), "<>", slotId),
                    ),
                );
                return {
                    readerSemaphore: this.readerSemaphoreValue(
                        this.readerLimitExpression(),
                        nextSlots,
                    ),
                    expiration: this.expirationValue(nextSlots, now),
                };
            })
            .where("sharedLock.key", "=", key)
            .where((eb) => eb.exists(this.unexpiredSlotQuery(slotId, now)))
            .returning("sharedLock.key")
            .executeTakeFirst();

        return reader !== undefined;
    }

    async refreshReader(
        key: string,
        slotId: string,
        ttl: Date,
    ): Promise<boolean> {
        const now = Date.now();
        const reader = await this.trxCtx.current
            .updateTable("sharedLock")
            .set(() => {
                const nextSlots = this.slotsArray(
                    this.refreshedSlotRows(slotId, ttl.getTime(), now),
                );
                return {
                    readerSemaphore: this.readerSemaphoreValue(
                        this.readerLimitExpression(),
                        nextSlots,
                    ),
                    expiration: this.expirationValue(nextSlots, now),
                };
            })
            .where("sharedLock.key", "=", key)
            .where((eb) =>
                eb.exists(this.unexpiredExpirableSlotQuery(slotId, now)),
            )
            .returning("sharedLock.key")
            .executeTakeFirst();

        return reader !== undefined;
    }

    async forceRelease(key: string): Promise<boolean> {
        const now = Date.now();
        const sharedLock = await this.trxCtx.current
            .deleteFrom("sharedLock")
            .where("sharedLock.key", "=", key)
            .returning(["sharedLock.writerLock", "sharedLock.readerSemaphore"])
            .executeTakeFirst();

        if (sharedLock === undefined) {
            return false;
        }

        const writerLock = KyselySharedLockAdapter.toWriterLock(
            sharedLock.writerLock,
        );
        if (writerLock !== null) {
            return KyselySharedLockAdapter.isWriterNotExpired(writerLock, now);
        }

        const readerSemaphore = KyselySharedLockAdapter.toReaderSemaphore(
            sharedLock.readerSemaphore,
        );
        if (readerSemaphore === null) {
            return false;
        }

        return readerSemaphore.slots.some((slot) =>
            KyselySharedLockAdapter.isSlotNotExpired(slot, now),
        );
    }

    async getState(key: string): Promise<ISharedLockAdapterState | null> {
        const now = Date.now();
        const sharedLock = await this.trxCtx.current
            .selectFrom("sharedLock")
            .where("sharedLock.key", "=", key)
            .select(["sharedLock.writerLock", "sharedLock.readerSemaphore"])
            .executeTakeFirst();

        if (sharedLock === undefined) {
            return null;
        }

        const writer = KyselySharedLockAdapter.toWriterState(
            sharedLock.writerLock,
            now,
        );
        if (writer !== null) {
            return { writer, reader: null };
        }

        const reader = KyselySharedLockAdapter.toReaderState(
            sharedLock.readerSemaphore,
            now,
        );
        if (reader !== null) {
            return { writer: null, reader };
        }

        return null;
    }

    private static toWriterState(
        value: KyselyWriterLockEntry | string | null,
        now: number,
    ): IWriterLockAdapterState | null {
        const writerLock = KyselySharedLockAdapter.toWriterLock(value);
        if (
            writerLock === null ||
            !KyselySharedLockAdapter.isWriterNotExpired(writerLock, now)
        ) {
            return null;
        }

        return {
            owner: writerLock.owner,
            expiration:
                writerLock.expiration === null
                    ? null
                    : new Date(writerLock.expiration),
        };
    }

    private static toReaderState(
        value: KyselyReaderSemaphoreEntry | string | null,
        now: number,
    ): IReaderSemaphoreAdapterState | null {
        const readerSemaphore =
            KyselySharedLockAdapter.toReaderSemaphore(value);
        if (readerSemaphore === null) {
            return null;
        }

        const unexpiredSlots = readerSemaphore.slots.filter((slot) =>
            KyselySharedLockAdapter.isSlotNotExpired(slot, now),
        );
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
            limit: readerSemaphore.limit,
            acquiredSlots,
        };
    }
}
