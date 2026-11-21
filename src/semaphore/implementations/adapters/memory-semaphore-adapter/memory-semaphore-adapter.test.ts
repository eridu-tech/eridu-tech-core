import { beforeEach, describe, expect, test } from "vitest";

import { MemorySemaphoreAdapter } from "@/semaphore/implementations/adapters/memory-semaphore-adapter/_module-exports.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module-exports.js";

import type { ISemaphoreAdapterState } from "@/semaphore/contracts/_module-exports.js";

const EXPIRED_AT = (): Date => new Date(Date.now() - 1_000);
const FUTURE_AT = (): Date => new Date(Date.now() + 300_000);

describe("class: MemorySemaphoreAdapter", { tags: ["Memory"] }, () => {
    semaphoreAdapterTestSuite({
        createAdapter: () => new MemorySemaphoreAdapter(new Map()),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove expired semaphore slots", async () => {
            const map = new Map<string, ISemaphoreAdapterState>([
                [
                    "expired",
                    {
                        limit: 4,
                        acquiredSlots: new Map([["1", EXPIRED_AT()]]),
                    },
                ],
            ]);
            const adapter = new MemorySemaphoreAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired semaphore slots", async () => {
            const map = new Map<string, ISemaphoreAdapterState>([
                [
                    "unexpired",
                    {
                        limit: 4,
                        acquiredSlots: new Map([["1", FUTURE_AT()]]),
                    },
                ],
            ]);
            const adapter = new MemorySemaphoreAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable semaphore slots", async () => {
            const map = new Map<string, ISemaphoreAdapterState>([
                [
                    "unexpireable",
                    {
                        limit: 4,
                        acquiredSlots: new Map([["1", null]]),
                    },
                ],
            ]);
            const adapter = new MemorySemaphoreAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should not remove any semaphore data when none slots are expired", async () => {
            const map = new Map<string, ISemaphoreAdapterState>([
                [
                    "unexpireable",
                    {
                        limit: 4,
                        acquiredSlots: new Map([["1", null]]),
                    },
                ],
                [
                    "unexpired",
                    {
                        limit: 4,
                        acquiredSlots: new Map([["1", FUTURE_AT()]]),
                    },
                ],
            ]);
            const adapter = new MemorySemaphoreAdapter(map);

            await adapter.removeAllExpired();

            expect(map.size).toBe(2);
            expect(map.has("unexpireable")).toBe(true);
            expect(map.has("unexpired")).toBe(true);
        });
        test("Should remove expired slots and keep entry when unexpired slots remain", async () => {
            const map = new Map<string, ISemaphoreAdapterState>([
                [
                    "a",
                    {
                        limit: 4,
                        acquiredSlots: new Map([
                            ["expired", EXPIRED_AT()],
                            ["unexpireable", null],
                        ]),
                    },
                ],
            ]);
            const adapter = new MemorySemaphoreAdapter(map);

            await adapter.removeAllExpired();

            const entry = map.get("a");
            expect(entry?.acquiredSlots.has("expired")).toBe(false);
            expect(entry?.acquiredSlots.has("unexpireable")).toBe(true);
        });
        test("Should do nothing when map is empty", async () => {
            const map = new Map<string, ISemaphoreAdapterState>();
            const adapter = new MemorySemaphoreAdapter(map);

            await adapter.removeAllExpired();

            expect(map.size).toBe(0);
        });
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const map = new Map<string, ISemaphoreAdapterState>([
                [
                    "a",
                    {
                        limit: 4,
                        acquiredSlots: new Map([["1", null]]),
                    },
                ],
                [
                    "b",
                    {
                        limit: 4,
                        acquiredSlots: new Map([["1", EXPIRED_AT()]]),
                    },
                ],
            ]);
            const adapter = new MemorySemaphoreAdapter(map);

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
