import { beforeEach, describe, expect, test } from "vitest";

import { MemoryCacheAdapter } from "@/cache/implementations/adapters/memory-cache-adapter/_module-exports.js";
import { cacheAdapterTestSuite } from "@/cache/implementations/test-utilities/_module-exports.js";

import type { MemoryCacheEntryData } from "@/cache/implementations/adapters/memory-cache-adapter/_module-exports.js";

const EXPIRED_AT = (): Date => new Date(Date.now() - 1_000);
const FUTURE_AT = (): Date => new Date(Date.now() + 300_000);

describe(
    "class: MemoryCacheAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "Cache"] },
    () => {
        cacheAdapterTestSuite({
            createAdapter: () => new MemoryCacheAdapter(),
            test,
            beforeEach,
            expect,
            describe,
        });
        describe("method: removeAllExpired", () => {
            test("Should remove expired cache entries", async () => {
                const map = new Map<string, MemoryCacheEntryData>([
                    ["expired", { value: "1", expiration: EXPIRED_AT() }],
                ]);
                const adapter = new MemoryCacheAdapter(map);

                await adapter.removeAllExpired();

                expect(map.has("expired")).toBe(false);
            });
            test("Should keep unexpired cache entries", async () => {
                const map = new Map<string, MemoryCacheEntryData>([
                    ["unexpired", { value: "2", expiration: FUTURE_AT() }],
                ]);
                const adapter = new MemoryCacheAdapter(map);

                await adapter.removeAllExpired();

                expect(map.has("unexpired")).toBe(true);
            });
            test("Should keep unexpireable cache entries", async () => {
                const map = new Map<string, MemoryCacheEntryData>([
                    ["unexpireable", { value: "3", expiration: null }],
                ]);
                const adapter = new MemoryCacheAdapter(map);

                await adapter.removeAllExpired();

                expect(map.has("unexpireable")).toBe(true);
            });
            test("Should not remove any cache entries when none are expired", async () => {
                const map = new Map<string, MemoryCacheEntryData>([
                    ["unexpireable", { value: "1", expiration: null }],
                    ["unexpired", { value: "2", expiration: FUTURE_AT() }],
                ]);
                const adapter = new MemoryCacheAdapter(map);

                await adapter.removeAllExpired();

                expect(map.size).toBe(2);
                expect(map.has("unexpireable")).toBe(true);
                expect(map.has("unexpired")).toBe(true);
            });
            test("Should do nothing when map is empty", async () => {
                const map = new Map<string, MemoryCacheEntryData>();
                const adapter = new MemoryCacheAdapter(map);

                await adapter.removeAllExpired();

                expect(map.size).toBe(0);
            });
        });
        describe("method: deInit", () => {
            test("Should clear map", async () => {
                const map = new Map<string, MemoryCacheEntryData>([
                    ["a", { value: "1", expiration: null }],
                    ["b", { value: "2", expiration: EXPIRED_AT() }],
                    ["c", { value: "3", expiration: FUTURE_AT() }],
                ]);
                const adapter = new MemoryCacheAdapter(map);

                await adapter.deInit();

                expect(map.size).toBe(0);
            });
        });
    },
);
