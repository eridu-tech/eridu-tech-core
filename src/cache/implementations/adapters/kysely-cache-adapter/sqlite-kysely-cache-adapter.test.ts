import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { KyselyCacheAdapter } from "@/cache/implementations/adapters/kysely-cache-adapter/_module.js";
import { cacheAdapterTestSuite } from "@/cache/implementations/test-utilities/_module.js";
import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { Database } from "better-sqlite3";

import type { KyselyCacheTables } from "@/cache/implementations/adapters/kysely-cache-adapter/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

describe("sqlite class: KyselyCacheAdapter", () => {
    let database: Database;
    beforeEach(() => {
        database = new Sqlite(":memory:");
    });
    afterEach(() => {
        database.close();
    });
    function createTrxCtx(
        database_: Database,
    ): ITransactionContext<Kysely<KyselyCacheTables>> {
        return new TransactionContext({
            token: contextToken("kysely"),
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
            adapter: new KyselyTransactionAdapter({
                database: new Kysely({
                    dialect: new SqliteDialect({
                        database: database_,
                    }),
                }),
            }),
        });
    }

    cacheAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyCacheAdapter({
                transactionContext: createTrxCtx(database),
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            return adapter;
        },
        test,
        beforeEach,
        expect,
        describe,
    });
    test("Transaction test", async () => {
        const trxCtx = createTrxCtx(database);
        const adapter = new KyselyCacheAdapter({
            transactionContext: trxCtx,
            serde: new Serde(new SuperJsonSerdeAdapter()),
        });
        await adapter.init();

        try {
            await trxCtx.run(async () => {
                await adapter.add("a", 1, null);
                await adapter.add("b", 1, null);
                throw new Error("Transaction failure");
            });
        } catch {
            /* EMPTY */
        }

        const rows = await trxCtx.client
            .selectFrom("cache")
            .select("cache.key")
            .execute();

        expect(rows.length).toBe(0);
    });
});
