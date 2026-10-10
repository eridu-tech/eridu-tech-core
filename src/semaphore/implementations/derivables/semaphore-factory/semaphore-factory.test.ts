import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { KyselySemaphoreAdapter } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module-exports.js";
import { MemorySemaphoreAdapter } from "@/semaphore/implementations/adapters/memory-semaphore-adapter/_module-exports.js";
import { SemaphoreFactory } from "@/semaphore/implementations/derivables/_module-exports.js";
import {
    semaphoreFactorySerdeTestSuite,
    semaphoreFactoryTestSuite,
} from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Database } from "better-sqlite3";

import type { ISemaphore } from "@/semaphore/contracts/_module-exports.js";
import type { KyselySemaphoreTables } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

describe("class: SemaphoreFactory", () => {
    async function createSemaphoreFactory() {
        const serde = new SuperJsonSerde();
        const semaphoreFactory = new SemaphoreFactory({
            serde,
            adapter: new MemorySemaphoreAdapter(),
        });
        await semaphoreFactory.init();
        return {
            semaphoreFactory,
            serde,
        };
    }

    semaphoreFactoryTestSuite({
        createSemaphoreFactory,
        beforeEach,
        describe,
        expect,
        test,
    });

    semaphoreFactorySerdeTestSuite({
        createSemaphoreFactory,
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
            const serde = new SuperJsonSerde();
            const key = "a";
            const ttl = null;
            const limit = 1;

            const adapter1 = new MemorySemaphoreAdapter();
            const lockProvider1 = new SemaphoreFactory({
                adapter: adapter1,
                serde,
            });
            await lockProvider1.init();
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
            await lockProvider2.init();
            const lock2 = lockProvider2.create(key, { ttl, limit });

            const deserializeSemaphore2 = await serde.deserialize<ISemaphore>(
                await serde.serialize(lock2),
            );
            const result = await deserializeSemaphore2.acquire();

            expect(result).toBe(true);
        });
        test("Should differentiate between different serializationIds", async () => {
            const serde = new SuperJsonSerde();
            const key = "a";
            const ttl = null;
            const limit = 1;

            const lockProvider1 = new SemaphoreFactory({
                adapter: new MemorySemaphoreAdapter(),
                serializationId: "adapter1",
                serde,
            });
            await lockProvider1.init();
            const lock1 = lockProvider1.create(key, { ttl, limit });

            await lock1.acquire();

            const lockProvider2 = new SemaphoreFactory({
                adapter: new MemorySemaphoreAdapter(),
                serializationId: "adapter2",
                serde,
            });
            await lockProvider2.init();
            const lock2 = lockProvider2.create(key, { ttl, limit });

            const deserializeSemaphore2 = await serde.deserialize<ISemaphore>(
                await serde.serialize(lock2),
            );
            const result = await deserializeSemaphore2.acquire();

            expect(result).toBe(true);
        });
    });
});
