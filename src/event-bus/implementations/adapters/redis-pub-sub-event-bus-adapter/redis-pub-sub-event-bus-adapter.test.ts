import { RedisContainer } from "@testcontainers/redis";
import Sqlite from "better-sqlite3";
import { Redis } from "ioredis";
import { Kysely, SqliteDialect } from "kysely";
import { describe, test, beforeEach, expect, afterEach, vi } from "vitest";

import { RedisPubSubEventBusAdapter } from "@/event-bus/implementations/adapters/redis-pub-sub-event-bus-adapter/redis-pub-sub-event-bus-adapter.js";
import { eventBusAdapterTestSuite } from "@/event-bus/implementations/test-utilities/_module.js";
import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/kysely-transaction-adapter.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: RedisPubSubEventBusAdapter", () => {
    let client: Redis;
    let startedContainer: StartedRedisContainer;
    beforeEach(async () => {
        startedContainer = await new RedisContainer("redis:7.2").start();
        client = new Redis(startedContainer.getConnectionUrl());
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await client.quit();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    const serde = new Serde(new SuperJsonSerdeAdapter());
    eventBusAdapterTestSuite({
        createAdapter: () =>
            new RedisPubSubEventBusAdapter({
                client,
                serde,
            }),
        test,
        beforeEach,
        expect,
        describe,
    });

    test("After commit test:", async () => {
        const database = new Sqlite(":memory:");
        try {
            const transactionContext = new TransactionContext({
                token: contextToken<ITransactionData<Kysely<any>>>("kysely"),
                adapter: new KyselyTransactionAdapter({
                    database: new Kysely({
                        dialect: new SqliteDialect({
                            database,
                        }),
                    }),
                }),
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });
            const eventBusAdapter = new RedisPubSubEventBusAdapter({
                client,
                serde,
                transactionHooks: transactionContext,
            });

            const listenerFn = vi.fn();
            await eventBusAdapter.addListener("eventA", listenerFn);

            try {
                await transactionContext.run(async () => {
                    await eventBusAdapter.dispatch("eventA", { data: "A" });
                    throw new Error("Transaction failed");
                });
            } catch {
                /* EMPTY */
            }

            expect(listenerFn).not.toHaveBeenCalled();
        } finally {
            database.close();
        }
    });
});
