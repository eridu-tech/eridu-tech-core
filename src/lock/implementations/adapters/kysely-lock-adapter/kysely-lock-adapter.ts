/**
 * @module Lock
 */

import { resolveTransactionAware } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Kysely } from "kysely";

import type {
    ILockAdapter,
    ILockAdapterState,
} from "@/lock/contracts/_module-exports.js";
import type {
    ITransactionConnection,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
    IPrunable,
} from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export type KyselyLockEntryTable = {
    key: string;
    owner: string;
    // Some sql database drivers (e.g. postgres) return bigint columns as strings or bigints.
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
    database: TransactionAware<Kysely<KyselyLockTables>>;
};

/**
 * To utilize the `KyselyLockAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Note in order to use `KyselyLockAdapter` correctly, ensure you use a single, consistent database across all server instances.
 * The adapter have been tested with `sqlite` and `postgres` databases.
 *
 * IMPORT_PATH: `"eridu-tech/lock/kysely-lock-adapter"`
 * @group Adapters
 */
export class KyselyLockAdapter
    implements ILockAdapter, IAsyncDeinitizable, IAsyncInitizable, IPrunable
{
    private readonly trxCtx: Pick<
        ITransactionConnection<Kysely<KyselyLockTables>>,
        "client" | "current"
    >;

    constructor(settings: KyselyLockAdapterSettings) {
        const { database } = settings;
        this.trxCtx = resolveTransactionAware(database);
    }

    /**
     * Removes all related lock tables and their rows.
     * Note all lock data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .dropIndex("lock_expiration")
                .on("lock")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema.dropTable("lock").execute();
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
            await this.trxCtx.client.schema
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
            await this.trxCtx.client.schema
                .createIndex("lock_expiration")
                .on("lock")
                .column("expiration")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    async removeAllExpired(): Promise<void> {
        await this.trxCtx.client
            .deleteFrom("lock")
            .where("lock.expiration", "<=", Date.now())
            .execute();
    }

    async acquire(
        key: string,
        lockId: string,
        ttl: Date | null,
    ): Promise<boolean> {
        const now = Date.now();
        const expiration = ttl?.getTime() ?? null;

        const lock = await this.trxCtx.current
            .insertInto("lock")
            .values({
                key,
                owner: lockId,
                expiration,
            })
            .onConflict((oc) =>
                oc
                    .column("key")
                    .doUpdateSet({
                        owner: lockId,
                        expiration: (eb) =>
                            eb
                                .case()
                                .when(
                                    eb.and([
                                        eb("lock.expiration", "is not", null),
                                        eb("lock.expiration", "<=", now),
                                    ]),
                                )
                                .then(expiration)
                                .else(eb.ref("lock.expiration"))
                                .end(),
                    })
                    .where((eb) =>
                        eb.or([
                            eb("lock.owner", "=", lockId),
                            eb.and([
                                eb("lock.expiration", "is not", null),
                                eb("lock.expiration", "<=", now),
                            ]),
                        ]),
                    ),
            )
            .returning("lock.key")
            .executeTakeFirst();

        return lock !== undefined;
    }

    async release(key: string, lockId: string): Promise<boolean> {
        const lock = await this.trxCtx.current
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

        return lock !== undefined;
    }

    async forceRelease(key: string): Promise<boolean> {
        const lock = await this.trxCtx.current
            .deleteFrom("lock")
            .where("lock.key", "=", key)
            .returning("lock.expiration")
            .executeTakeFirst();

        if (lock === undefined) {
            return false;
        }
        if (lock.expiration === null) {
            return true;
        }
        return Number(lock.expiration) >= Date.now();
    }

    async refresh(key: string, lockId: string, ttl: Date): Promise<boolean> {
        const lock = await this.trxCtx.current
            .updateTable("lock")
            .set({
                expiration: ttl.getTime(),
            })
            .where("lock.key", "=", key)
            .where("lock.owner", "=", lockId)
            .where((eb) =>
                eb.and([
                    eb("lock.expiration", "is not", null),
                    eb("lock.expiration", ">", Date.now()),
                ]),
            )
            .returning("lock.key")
            .executeTakeFirst();

        return lock !== undefined;
    }

    async getState(key: string): Promise<ILockAdapterState | null> {
        const lock = await this.trxCtx.current
            .selectFrom("lock")
            .where("lock.key", "=", key)
            .select(["lock.owner", "lock.expiration"])
            .executeTakeFirst();

        if (lock === undefined) {
            return null;
        }
        if (lock.expiration !== null && Number(lock.expiration) <= Date.now()) {
            return null;
        }
        return {
            owner: lock.owner,
            expiration:
                lock.expiration === null
                    ? null
                    : new Date(Number(lock.expiration)),
        };
    }
}
