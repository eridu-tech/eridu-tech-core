import EventEmitter from "node:events";

import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { describe, test, beforeEach, expect, vi, afterEach } from "vitest";

import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/memory-event-bus-adapter/memory-event-bus-adapter.js";
import { eventBusAdapterTestSuite } from "@/event-bus/implementations/test-utilities/_module-exports.js";
import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

describe(
    "class: MemoryEventBusAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "EventBus"] },
    () => {
        let adapter: MemoryEventBusAdapter;
        beforeEach(() => {
            adapter = new MemoryEventBusAdapter({
                eventEmitter: new EventEmitter(),
            });
        });
        eventBusAdapterTestSuite({
            createAdapter: () => adapter,
            test,
            beforeEach,
            expect,
            describe,
        });

        describe("method: addListener, dispatch", () => {
            let prefixlessAdapter: MemoryEventBusAdapter;
            beforeEach(() => {
                prefixlessAdapter = new MemoryEventBusAdapter();
            });
            afterEach(() => {
                prefixlessAdapter.deInit();
            });

            test("Should support an empty event name", async () => {
                const listenerFn = vi.fn();

                await prefixlessAdapter.addListener("", listenerFn);
                await prefixlessAdapter.dispatch("", { type: "event" });

                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });
        });

        describe("method: deInit", () => {
            test("Should not throw when called multiple times", () => {
                adapter.deInit();

                expect(() => {
                    adapter.deInit();
                }).not.throw();
            });

            test("Should not call listeners when events are dispatched after deInit", async () => {
                const listenerFn = vi.fn();
                await adapter.addListener("event", listenerFn);

                adapter.deInit();
                await adapter.dispatch("event", { type: "event" });

                expect(listenerFn).not.toHaveBeenCalled();
            });
        });

        describe("Transaction tests:", () => {
            let database: InstanceType<typeof Sqlite>;
            let transactionContext: TransactionContext<
                Kysely<any>,
                Kysely<any>
            >;
            let trxAwareAdapter: MemoryEventBusAdapter;

            beforeEach(() => {
                database = new Sqlite(":memory:");
                transactionContext = new TransactionContext({
                    token: contextToken<ITransactionData<Kysely<any>>>(
                        "kysely",
                    ),
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
                trxAwareAdapter = new MemoryEventBusAdapter({
                    transactionHooks: transactionContext,
                });
            });
            afterEach(() => {
                database.close();
                trxAwareAdapter.deInit();
            });

            test("Should not dispatch when the transaction fails", async () => {
                const listenerFn = vi.fn();
                await trxAwareAdapter.addListener("eventA", listenerFn);

                try {
                    await transactionContext.run(async () => {
                        await trxAwareAdapter.dispatch("eventA", {
                            data: "A",
                        });
                        throw new Error("Transaction failed");
                    });
                } catch {
                    /* EMPTY */
                }

                expect(listenerFn).not.toHaveBeenCalled();
            });

            test("Should dispatch only after the transaction commits", async () => {
                const listenerFn = vi.fn();
                await trxAwareAdapter.addListener("eventA", listenerFn);

                await transactionContext.run(async () => {
                    await trxAwareAdapter.dispatch("eventA", { data: "A" });
                    expect(listenerFn).not.toHaveBeenCalled();
                });

                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ data: "A" });
            });

            test("Should dispatch immediately when there is no active transaction", async () => {
                const listenerFn = vi.fn();
                await trxAwareAdapter.addListener("eventA", listenerFn);

                await trxAwareAdapter.dispatch("eventA", { data: "A" });

                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ data: "A" });
            });
        });
    },
);
