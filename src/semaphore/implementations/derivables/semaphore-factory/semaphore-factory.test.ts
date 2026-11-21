import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { UnableToAcquireSemaphoreError } from "@/semaphore/contracts/_module-exports.js";
import { KyselySemaphoreAdapter } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module-exports.js";
import { MemorySemaphoreAdapter } from "@/semaphore/implementations/adapters/memory-semaphore-adapter/_module-exports.js";
import { SemaphoreFactory } from "@/semaphore/implementations/derivables/_module-exports.js";
import {
    semaphoreFactorySerdeTestSuite,
    semaphoreFactoryTestSuite,
} from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";

import type { ISemaphore } from "@/semaphore/contracts/_module-exports.js";
import type { KyselySemaphoreTables } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module-exports.js";

describe(
    "class: SemaphoreFactory",
    { tags: ["Memory", "Derivables", "Implementations", "Semaphore"] },
    () => {
        let suiteSerde: SuperJsonSerde;
        let suiteSemaphoreFactory: SemaphoreFactory;

        beforeEach(() => {
            suiteSerde = new SuperJsonSerde();
            suiteSemaphoreFactory = new SemaphoreFactory({
                serde: suiteSerde,
                adapter: new MemorySemaphoreAdapter(),
            });
            suiteSemaphoreFactory.init();
        });

        semaphoreFactoryTestSuite({
            createSemaphoreFactory: () => ({
                semaphoreFactory: suiteSemaphoreFactory,
                serde: suiteSerde,
            }),
            beforeEach,
            describe,
            expect,
            test,
        });

        semaphoreFactorySerdeTestSuite({
            createSemaphoreFactory: () => ({
                semaphoreFactory: suiteSemaphoreFactory,
                serde: suiteSerde,
            }),
            beforeEach,
            describe,
            expect,
            test,
        });

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
                lockProvider1.init();
                const lock1 = lockProvider1.create(key, { ttl, limit });

                await lock1.acquire();

                const adapter2 = new KyselySemaphoreAdapter({
                    database: new Kysely<KyselySemaphoreTables>({
                        dialect: new SqliteDialect({
                            database: new Sqlite(":memory:"),
                        }),
                    }),
                });
                await adapter2.init();
                const lockProvider2 = new SemaphoreFactory({
                    adapter: adapter2,
                    serde,
                });
                lockProvider2.init();
                const lock2 = lockProvider2.create(key, { ttl, limit });

                const deserializeSemaphore2 = serde.deserialize<ISemaphore>(
                    serde.serialize(lock2),
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
                lockProvider1.init();
                const lock1 = lockProvider1.create(key, { ttl, limit });

                await lock1.acquire();

                const lockProvider2 = new SemaphoreFactory({
                    adapter: new MemorySemaphoreAdapter(),
                    serializationId: "adapter2",
                    serde,
                });
                lockProvider2.init();
                const lock2 = lockProvider2.create(key, { ttl, limit });

                const deserializeSemaphore2 = serde.deserialize<ISemaphore>(
                    serde.serialize(lock2),
                );
                const result = await deserializeSemaphore2.acquire();

                expect(result).toBe(true);
            });
        });
        describe("Unexpected adapter error handling:", () => {
            test("Should reject with UnableToAcquireSemaphoreError when adapter acquire fails", async () => {
                const unexpectedError = new Error("Unexpected adapter error");
                const adapter = new MemorySemaphoreAdapter();
                vi.spyOn(adapter, "acquire").mockRejectedValue(unexpectedError);
                const semaphoreFactory = new SemaphoreFactory({ adapter });
                semaphoreFactory.init();

                const promise = semaphoreFactory
                    .create("a", { ttl: null, limit: 1 })
                    .acquire();

                await expect(promise).rejects.toThrow(
                    UnableToAcquireSemaphoreError,
                );
                await expect(promise).rejects.toHaveProperty(
                    "cause",
                    unexpectedError,
                );
            });
            test("Should reject with UnableToAcquireSemaphoreError when deserialized semaphore acquire fails", async () => {
                const serde = new SuperJsonSerde();
                const unexpectedError = new Error("Unexpected adapter error");
                const adapter = new MemorySemaphoreAdapter();
                vi.spyOn(adapter, "acquire").mockRejectedValue(unexpectedError);
                const semaphoreFactory = new SemaphoreFactory({
                    adapter,
                    serde,
                });
                semaphoreFactory.init();

                const deserializedSemaphore = serde.deserialize<ISemaphore>(
                    serde.serialize(
                        semaphoreFactory.create("a", { ttl: null, limit: 1 }),
                    ),
                );
                const promise = deserializedSemaphore.acquire();

                await expect(promise).rejects.toThrow(
                    UnableToAcquireSemaphoreError,
                );
                await expect(promise).rejects.toHaveProperty(
                    "cause",
                    unexpectedError,
                );
            });
        });
    },
);
