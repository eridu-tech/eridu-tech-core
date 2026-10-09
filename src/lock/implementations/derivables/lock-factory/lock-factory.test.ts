import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { KyselyLockAdapter } from "@/lock/implementations/adapters/kysely-lock-adapter/_module-exports.js";
import { MemoryLockAdapter } from "@/lock/implementations/adapters/memory-lock-adapter/_module-exports.js";
import { LockFactory } from "@/lock/implementations/derivables/_module-exports.js";
import {
    lockFactorySerdeTestSuite,
    lockFactoryTestSuite,
} from "@/lock/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Database } from "better-sqlite3";

import type { ILock } from "@/lock/contracts/_module-exports.js";
import type { KyselyLockTables } from "@/lock/implementations/adapters/kysely-lock-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

describe("class: LockFactory", () => {
    function createLockFactory() {
        const serde = new SuperJsonSerde();
        const lockFactory = new LockFactory({
            serde,
            adapter: new MemoryLockAdapter(),
        });
        return {
            lockFactory,
            serde,
        };
    }

    lockFactoryTestSuite({
        createLockFactory,
        beforeEach,
        describe,
        expect,
        test,
    });

    lockFactorySerdeTestSuite({
        createLockFactory,
        beforeEach,
        describe,
        expect,
        test,
    });

    function createTrxCtx(
        database_: Database,
    ): ITransactionContext<Kysely<KyselyLockTables>> {
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
        test("Should differentiate between different adapters that have same namespace", async () => {
            const serde = new SuperJsonSerde();
            const key = "a";
            const ttl = null;

            const adapter1 = new MemoryLockAdapter();
            const lockFactory1 = new LockFactory({
                adapter: adapter1,
                serde,
            });
            const lock1 = lockFactory1.create(key, { ttl });
            await lock1.acquire();

            const adapter2 = new KyselyLockAdapter({
                transactionContext: createTrxCtx(new Sqlite(":memory:")),
            });
            await adapter2.init();
            const lockFactory2 = new LockFactory({
                adapter: adapter2,
                serde,
            });

            const lock2 = lockFactory2.create(key, { ttl });
            const deserializeLock2 = await serde.deserialize<ILock>(
                await serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquire();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new SuperJsonSerde();
            const key = "a";
            const ttl = null;

            const lockFactory1 = new LockFactory({
                adapter: new MemoryLockAdapter(),
                serdeTransformerName: "adapter1",
                serde,
            });
            const lock1 = lockFactory1.create(key, { ttl });
            await lock1.acquire();

            const lockFactory2 = new LockFactory({
                adapter: new MemoryLockAdapter(),
                serdeTransformerName: "adapter2",
                serde,
            });

            const lock2 = lockFactory2.create(key, { ttl });
            const deserializeLock2 = await serde.deserialize<ILock>(
                await serde.serialize(lock2),
            );
            const result = await deserializeLock2.acquire();

            expect(result).toBe(true);
        });
    });
});
