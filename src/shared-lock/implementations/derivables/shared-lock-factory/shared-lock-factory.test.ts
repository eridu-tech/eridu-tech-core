import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import {
    KyselySharedLockAdapter,
    MemorySharedLockAdapter,
} from "@/shared-lock/implementations/adapters/_module.js";
import { SharedLockFactory } from "@/shared-lock/implementations/derivables/_module.js";
import { sharedLockFactoryTestSuite } from "@/shared-lock/implementations/test-utilities/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { Database } from "better-sqlite3";

import type { ISharedLock } from "@/shared-lock/contracts/_module.js";
import type { KyselySharedLockTables } from "@/shared-lock/implementations/adapters/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

describe("class: SharedLockFactory", () => {
    sharedLockFactoryTestSuite({
        createSharedLockFactory: () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const sharedLockFactory = new SharedLockFactory({
                serde,
                adapter: new MemorySharedLockAdapter(),
            });
            return { sharedLockFactory, serde };
        },
        beforeEach,
        describe,
        expect,
        test,
        retry: 10,
    });

    function createTrxCtx(
        database_: Database,
    ): ITransactionContext<Kysely<KyselySharedLockTables>> {
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
    describe("Serde tests:", () => {
        test("Should differentiate between different adapters", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const key = "a";
            const ttl = null;
            const limit = 4;

            const adapter1 = new MemorySharedLockAdapter();
            const sharedLockFactory1 = new SharedLockFactory({
                adapter: adapter1,
                serde,
            });
            const lock1 = sharedLockFactory1.create(key, { ttl, limit });
            await lock1.acquireWriter();

            const adapter2 = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(new Sqlite(":memory:")),
            });
            await adapter2.init();
            const sharedLockFactory2 = new SharedLockFactory({
                adapter: adapter2,
                serde,
            });

            const lock2 = sharedLockFactory2.create(key, { ttl, limit });
            const deserializeLock2 = serde.deserialize<ISharedLock>(
                serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquireWriter();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const key = "a";
            const ttl = null;
            const limit = 4;

            const sharedLockFactory1 = new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
                serdeTransformerName: "adapter1",
                serde,
            });
            const lock1 = sharedLockFactory1.create(key, { ttl, limit });
            await lock1.acquireWriter();

            const sharedLockFactory2 = new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
                serdeTransformerName: "adapter2",
                serde,
            });

            const lock2 = sharedLockFactory2.create(key, { ttl, limit });
            const deserializeLock2 = serde.deserialize<ISharedLock>(
                serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquireWriter();

            expect(result).toBe(true);
        });
    });
});
