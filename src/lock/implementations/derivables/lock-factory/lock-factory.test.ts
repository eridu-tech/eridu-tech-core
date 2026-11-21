import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UnableToAcquireLockError } from "@/lock/contracts/_module-exports.js";
import { KyselyLockAdapter } from "@/lock/implementations/adapters/kysely-lock-adapter/_module-exports.js";
import { MemoryLockAdapter } from "@/lock/implementations/adapters/memory-lock-adapter/_module-exports.js";
import { LockFactory } from "@/lock/implementations/derivables/_module-exports.js";
import {
    lockFactorySerdeTestSuite,
    lockFactoryTestSuite,
} from "@/lock/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";

import type { ILock } from "@/lock/contracts/_module-exports.js";
import type { KyselyLockTables } from "@/lock/implementations/adapters/kysely-lock-adapter/_module-exports.js";

describe(
    "class: LockFactory",
    { tags: ["Memory", "Derivables", "Implementations", "Lock"] },
    () => {
        let suiteSerde: SuperJsonSerde;
        let suiteLockFactory: LockFactory;

        beforeEach(() => {
            suiteSerde = new SuperJsonSerde();
            suiteLockFactory = new LockFactory({
                serde: suiteSerde,
                adapter: new MemoryLockAdapter(),
            });
            suiteLockFactory.init();
        });

        lockFactoryTestSuite({
            createLockFactory: () => ({
                lockFactory: suiteLockFactory,
                serde: suiteSerde,
            }),
            beforeEach,
            describe,
            expect,
            test,
        });

        lockFactorySerdeTestSuite({
            createLockFactory: () => ({
                lockFactory: suiteLockFactory,
                serde: suiteSerde,
            }),
            beforeEach,
            describe,
            expect,
            test,
        });

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
                lockFactory1.init();
                const lock1 = lockFactory1.create(key, { ttl });

                await lock1.acquire();

                const adapter2 = new KyselyLockAdapter({
                    database: new Kysely<KyselyLockTables>({
                        dialect: new SqliteDialect({
                            database: new Sqlite(":memory:"),
                        }),
                    }),
                });
                await adapter2.init();
                const lockFactory2 = new LockFactory({
                    adapter: adapter2,
                    serde,
                });
                lockFactory2.init();

                const lock2 = lockFactory2.create(key, { ttl });
                const deserializeLock2 = serde.deserialize<ILock>(
                    serde.serialize(lock2),
                );
                const result = await deserializeLock2.acquire();

                expect(result).toBe(true);
            });
            test("Should differentiate between different serializationIds", async () => {
                const serde = new SuperJsonSerde();
                const key = "a";
                const ttl = null;

                const lockFactory1 = new LockFactory({
                    adapter: new MemoryLockAdapter(),
                    serializationId: "adapter1",
                    serde,
                });
                lockFactory1.init();
                const lock1 = lockFactory1.create(key, { ttl });

                await lock1.acquire();

                const lockFactory2 = new LockFactory({
                    adapter: new MemoryLockAdapter(),
                    serializationId: "adapter2",
                    serde,
                });
                lockFactory2.init();
                const lock2 = lockFactory2.create(key, { ttl });

                const deserializeLock2 = serde.deserialize<ILock>(
                    serde.serialize(lock2),
                );
                const result = await deserializeLock2.acquire();

                expect(result).toBe(true);
            });
        });
        describe("Unexpected adapter error handling:", () => {
            test("Should reject with UnableToAcquireLockError when adapter acquire fails", async () => {
                const unexpectedError = new Error("Unexpected adapter error");
                const adapter = new MemoryLockAdapter();
                vi.spyOn(adapter, "acquire").mockRejectedValue(unexpectedError);
                const lockFactory = new LockFactory({ adapter });
                lockFactory.init();

                const promise = lockFactory
                    .create("a", { ttl: null })
                    .acquire();

                await expect(promise).rejects.toThrow(UnableToAcquireLockError);
                await expect(promise).rejects.toHaveProperty(
                    "cause",
                    unexpectedError,
                );
            });
            test("Should reject with UnableToAcquireLockError when deserialized lock acquire fails", async () => {
                const serde = new SuperJsonSerde();
                const unexpectedError = new Error("Unexpected adapter error");
                const adapter = new MemoryLockAdapter();
                vi.spyOn(adapter, "acquire").mockRejectedValue(unexpectedError);
                const lockFactory = new LockFactory({ adapter, serde });
                lockFactory.init();

                const deserializedLock = serde.deserialize<ILock>(
                    serde.serialize(lockFactory.create("a", { ttl: null })),
                );
                const promise = deserializedLock.acquire();

                await expect(promise).rejects.toThrow(UnableToAcquireLockError);
                await expect(promise).rejects.toHaveProperty(
                    "cause",
                    unexpectedError,
                );
            });
        });
    },
);
