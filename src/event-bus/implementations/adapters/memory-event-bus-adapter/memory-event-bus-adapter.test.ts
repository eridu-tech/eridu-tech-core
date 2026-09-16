import EventEmitter from "node:events";

import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { describe, test, beforeEach, expect, vi } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/memory-event-bus-adapter/memory-event-bus-adapter.js";
import { eventBusAdapterTestSuite } from "@/event-bus/implementations/test-utilities/_module.js";
import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module.js";

describe("class: MemoryEventBusAdapter", () => {
    eventBusAdapterTestSuite({
        createAdapter: () =>
            new MemoryEventBusAdapter({
                eventEmitter: new EventEmitter(),
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
            const eventBusAdapter = new MemoryEventBusAdapter({
                eventEmitter: new EventEmitter(),
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
