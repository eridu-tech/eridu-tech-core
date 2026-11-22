import { beforeEach, describe, expect, test } from "vitest";

import { MemoryRateLimiterStorageAdapter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/memory-rate-limiter-storage-adapter.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";
import { delay } from "@/utilities/_module-exports.js";

import type { MemoryRateLimiterData } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/memory-rate-limiter-storage-adapter.js";
import type { IRateLimiterData } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/rate-limiter-storage-adapter.contract.js";

describe(
    "class: MemoryRateLimiterStorageAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        let adapter1: MemoryRateLimiterStorageAdapter<string>;

        beforeEach(() => {
            adapter1 = new MemoryRateLimiterStorageAdapter();
        });
        describe("method: transaction upsert / find", () => {
            test("Should insert item when key doesnt exists", async () => {
                const key = "a";
                const value = "b";
                const expiration = TimeSpan.fromMinutes(5).toEndDate(
                    new Date("2026-01-01"),
                );

                const data = await adapter1.transaction(async (trx) => {
                    await trx.upsert(key, value, expiration);
                    return await trx.find(key);
                });

                expect(data).toEqual({
                    state: value,
                    expiration,
                } satisfies IRateLimiterData<string>);
            });
            test("Should update item when key exists", async () => {
                const key = "d";
                const value = "f";
                const expiration = TimeSpan.fromHours(5).toEndDate(
                    new Date("2026-01-01"),
                );

                const data = await adapter1.transaction(async (trx) => {
                    await trx.upsert(
                        "a",
                        "b",
                        TimeSpan.fromMinutes(5).toEndDate(
                            new Date("2026-01-01"),
                        ),
                    );
                    await trx.upsert(key, value, expiration);
                    return await trx.find(key);
                });

                expect(data).toEqual({
                    state: value,
                    expiration,
                } satisfies IRateLimiterData<string>);
            });
        });
        describe("method: transaction find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const data = await adapter1.transaction(async (trx) => {
                    return await trx.find(noneExistingKey);
                });

                expect(data).toBeNull();
            });
        });
        describe("method: find", () => {
            test("Should return null when key doesnt exists", async () => {
                const noneExistingKey = "a";

                const data = await adapter1.find(noneExistingKey);

                expect(data).toBeNull();
            });
        });
        describe("method: remove", () => {
            test("Should remove item when key exists", async () => {
                const key = "a";
                const value = "b";
                const expiration = TimeSpan.fromMinutes(5).toEndDate(
                    new Date("2026-01-01"),
                );

                await adapter1.transaction(async (trx) => {
                    await trx.upsert(key, value, expiration);
                });
                await adapter1.remove(key);
                const item = await adapter1.find(key);

                expect(item).toBeNull();
            });
        });
        describe("method: removeAllExpired", () => {
            test("Should remove expired rate limiters", async () => {
                const map = new Map<string, MemoryRateLimiterData>();
                const adapter = new MemoryRateLimiterStorageAdapter(map);

                await adapter.transaction(async (trx) => {
                    await trx.upsert(
                        "expired",
                        1,
                        TimeSpan.fromMilliseconds(100).toEndDate(),
                    );
                });

                await delay(TimeSpan.fromMilliseconds(200));

                await adapter.removeAllExpired();

                expect(map.has("expired")).toBe(false);
            });
            test("Should keep unexpired rate limiters", async () => {
                const map = new Map<string, MemoryRateLimiterData>();
                const adapter = new MemoryRateLimiterStorageAdapter(map);

                await adapter.transaction(async (trx) => {
                    await trx.upsert(
                        "unexpired",
                        2,
                        TimeSpan.fromMinutes(5).toEndDate(),
                    );
                });

                await delay(TimeSpan.fromMilliseconds(200));

                await adapter.removeAllExpired();

                expect(map.has("unexpired")).toBe(true);
            });
            test("Should not remove any rate limiters when none are expired", async () => {
                const map = new Map<string, MemoryRateLimiterData>();
                const adapter = new MemoryRateLimiterStorageAdapter(map);

                await adapter.transaction(async (trx) => {
                    await trx.upsert(
                        "a",
                        1,
                        TimeSpan.fromMinutes(5).toEndDate(),
                    );
                    await trx.upsert(
                        "b",
                        2,
                        TimeSpan.fromMinutes(5).toEndDate(),
                    );
                });

                await delay(TimeSpan.fromMilliseconds(200));

                await adapter.removeAllExpired();

                expect(map.size).toBe(2);
                expect(map.has("a")).toBe(true);
                expect(map.has("b")).toBe(true);
            });
        });
        describe("method: deInit", () => {
            test("Should clear rate limiter data", async () => {
                const map = new Map<string, MemoryRateLimiterData>();
                const adapter = new MemoryRateLimiterStorageAdapter(map);

                await adapter.transaction(async (trx) => {
                    await trx.upsert(
                        "a",
                        1,
                        TimeSpan.fromSeconds(2).toEndDate(),
                    );
                    await trx.upsert(
                        "b",
                        2,
                        TimeSpan.fromSeconds(2).toEndDate(),
                    );
                    await trx.upsert(
                        "c",
                        3,
                        TimeSpan.fromSeconds(2).toEndDate(),
                    );
                });
                await adapter.deInit();

                expect(map.size).toBe(0);
            });
            test("Should not throw error when called multiple times", async () => {
                const adapter = new MemoryRateLimiterStorageAdapter();
                await adapter.deInit();

                const promise = adapter.deInit();

                await expect(promise).resolves.toBeUndefined();
            });
            test("Should not throw error when called before init", async () => {
                const adapter = new MemoryRateLimiterStorageAdapter();

                const promise = adapter.deInit();

                await expect(promise).resolves.toBeUndefined();
            });
        });
    },
);
