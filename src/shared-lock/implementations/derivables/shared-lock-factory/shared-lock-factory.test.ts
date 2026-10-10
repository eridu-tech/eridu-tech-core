import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { KyselySharedLockAdapter } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module-exports.js";
import { MemorySharedLockAdapter } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module-exports.js";
import { SharedLockFactory } from "@/shared-lock/implementations/derivables/_module-exports.js";
import {
    sharedLockFactorySerdeTestSuite,
    sharedLockFactoryTestSuite,
} from "@/shared-lock/implementations/test-utilities/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Database } from "better-sqlite3";

import type { ISharedLock } from "@/shared-lock/contracts/_module-exports.js";
import type { KyselySharedLockTables } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

describe("class: SharedLockFactory", () => {
    async function createSharedLockFactory() {
        const serde = new SuperJsonSerde();
        const sharedLockFactory = new SharedLockFactory({
            serde,
            adapter: new MemorySharedLockAdapter(),
        });
        await sharedLockFactory.init();
        return { sharedLockFactory, serde };
    }

    sharedLockFactoryTestSuite({
        createSharedLockFactory,
        beforeEach,
        describe,
        expect,
        test,
        retry: 10,
    });

    sharedLockFactorySerdeTestSuite({
        createSharedLockFactory,
        beforeEach,
        describe,
        expect,
        test,
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
            const serde = new SuperJsonSerde();
            const key = "a";
            const ttl = null;
            const limit = 4;

            const adapter1 = new MemorySharedLockAdapter();
            const sharedLockFactory1 = new SharedLockFactory({
                adapter: adapter1,
                serde,
            });
            await sharedLockFactory1.init();
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
            await sharedLockFactory2.init();
            const lock2 = sharedLockFactory2.create(key, { ttl, limit });

            const deserializeLock2 = await serde.deserialize<ISharedLock>(
                await serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquireWriter();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serializationIds", async () => {
            const serde = new SuperJsonSerde();
            const key = "a";
            const ttl = null;
            const limit = 4;

            const sharedLockFactory1 = new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
                serializationId: "adapter1",
                serde,
            });
            await sharedLockFactory1.init();
            const lock1 = sharedLockFactory1.create(key, { ttl, limit });

            await lock1.acquireWriter();

            const sharedLockFactory2 = new SharedLockFactory({
                adapter: new MemorySharedLockAdapter(),
                serializationId: "adapter2",
                serde,
            });
            await sharedLockFactory2.init();
            const lock2 = sharedLockFactory2.create(key, { ttl, limit });

            const deserializeLock2 = await serde.deserialize<ISharedLock>(
                await serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquireWriter();

            expect(result).toBe(true);
        });
    });
});
