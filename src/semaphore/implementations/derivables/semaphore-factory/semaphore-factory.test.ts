import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { MemorySemaphoreAdapter } from "@/semaphore/implementations/adapters/_module.js";
import { KyselySemaphoreAdapter } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module.js";
import { SemaphoreFactory } from "@/semaphore/implementations/derivables/_module.js";
import { semaphoreFactoryTestSuite } from "@/semaphore/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { Database } from "better-sqlite3";

import type { ISemaphore } from "@/semaphore/contracts/_module.js";
import type { KyselySemaphoreTables } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

describe("class: SemaphoreFactory", () => {
    semaphoreFactoryTestSuite({
        createSemaphoreFactory: () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const semaphoreFactory = new SemaphoreFactory({
                serde,
                adapter: new MemorySemaphoreAdapter(),
            });
            return {
                semaphoreFactory,
                serde,
            };
        },
        beforeEach,
        describe,
        expect,
        test,
    });

    function createTrxCtx(
        database_: Database,
    ): ITransactionContext<Kysely<KyselySemaphoreTables>> {
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
            const limit = 1;

            const adapter1 = new MemorySemaphoreAdapter();
            const lockProvider1 = new SemaphoreFactory({
                adapter: adapter1,
                serde,
            });
            const lock1 = lockProvider1.create(key, { ttl, limit });
            await lock1.acquire();

            const adapter2 = new KyselySemaphoreAdapter({
                transactionContext: createTrxCtx(new Sqlite(":memory:")),
            });
            await adapter2.init();
            const lockProvider2 = new SemaphoreFactory({
                adapter: adapter2,
                serde,
            });

            const lock2 = lockProvider2.create(key, { ttl, limit });
            const deserializeSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(lock2),
            );
            const result = await deserializeSemaphore2.acquire();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serdeTransformerNames", async () => {
            const serde = new Serde(new SuperJsonSerdeAdapter());
            const key = "a";
            const ttl = null;
            const limit = 1;

            const lockProvider1 = new SemaphoreFactory({
                adapter: new MemorySemaphoreAdapter(),
                serdeTransformerName: "adapter1",
                serde,
            });
            const lock1 = lockProvider1.create(key, { ttl, limit });
            await lock1.acquire();

            const lockProvider2 = new SemaphoreFactory({
                adapter: new MemorySemaphoreAdapter(),
                serdeTransformerName: "adapter2",
                serde,
            });

            const lock2 = lockProvider2.create(key, { ttl, limit });
            const deserializeSemaphore2 = serde.deserialize<ISemaphore>(
                serde.serialize(lock2),
            );
            const result = await deserializeSemaphore2.acquire();

            expect(result).toBe(true);
        });
    });
});
