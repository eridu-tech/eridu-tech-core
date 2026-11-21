import { beforeEach, describe, expect, test } from "vitest";

import { MemorySharedLockAdapter } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module-exports.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module-exports.js";

import type { MemorySharedLockData } from "@/shared-lock/implementations/adapters/memory-shared-lock-adapter/_module-exports.js";

const EXPIRED_AT = (): Date => new Date(Date.now() - 1_000);
const FUTURE_AT = (): Date => new Date(Date.now() + 300_000);

describe("class: MemorySharedLockAdapter", { tags: ["Memory"] }, () => {
    sharedLockAdapterTestSuite({
        createAdapter: () => new MemorySharedLockAdapter(new Map()),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove expired writer locks", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "expired",
                    {
                        writerLock: { owner: "1", expiration: EXPIRED_AT() },
                        readerSemaphore: null,
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired writer locks", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "unexpired",
                    {
                        writerLock: { owner: "3", expiration: FUTURE_AT() },
                        readerSemaphore: null,
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable writer locks", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "unexpireable",
                    {
                        writerLock: { owner: "2", expiration: null },
                        readerSemaphore: null,
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should remove expired reader slots", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "expired",
                    {
                        writerLock: null,
                        readerSemaphore: {
                            limit: 4,
                            slots: new Map([["1", EXPIRED_AT()]]),
                        },
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired reader slots", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "unexpired",
                    {
                        writerLock: null,
                        readerSemaphore: {
                            limit: 4,
                            slots: new Map([["2", FUTURE_AT()]]),
                        },
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable reader slots", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "unexpireable",
                    {
                        writerLock: null,
                        readerSemaphore: {
                            limit: 4,
                            slots: new Map([["3", null]]),
                        },
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should not remove any shared locks when none are expired", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "writer-unexpireable",
                    {
                        writerLock: { owner: "1", expiration: null },
                        readerSemaphore: null,
                    },
                ],
                [
                    "reader-unexpired",
                    {
                        writerLock: null,
                        readerSemaphore: {
                            limit: 4,
                            slots: new Map([["1", FUTURE_AT()]]),
                        },
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.size).toBe(2);
            expect(map.has("writer-unexpireable")).toBe(true);
            expect(map.has("reader-unexpired")).toBe(true);
        });
        test("Should remove expired reader slots and keep entry when unexpired slots remain", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "a",
                    {
                        writerLock: null,
                        readerSemaphore: {
                            limit: 4,
                            slots: new Map([
                                ["expired", EXPIRED_AT()],
                                ["unexpireable", null],
                            ]),
                        },
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            const entry = map.get("a");
            expect(entry?.readerSemaphore?.slots.has("expired")).toBe(false);
            expect(entry?.readerSemaphore?.slots.has("unexpireable")).toBe(
                true,
            );
        });
        test("Should do nothing when map is empty", async () => {
            const map = new Map<string, MemorySharedLockData>();
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.size).toBe(0);
        });
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const map = new Map<string, MemorySharedLockData>([
                [
                    "a",
                    {
                        writerLock: { owner: "1", expiration: null },
                        readerSemaphore: null,
                    },
                ],
                [
                    "b",
                    {
                        writerLock: { owner: "2", expiration: EXPIRED_AT() },
                        readerSemaphore: null,
                    },
                ],
                [
                    "c",
                    {
                        writerLock: null,
                        readerSemaphore: {
                            limit: 4,
                            slots: new Map([["1", null]]),
                        },
                    },
                ],
                [
                    "d",
                    {
                        writerLock: null,
                        readerSemaphore: {
                            limit: 4,
                            slots: new Map([["1", EXPIRED_AT()]]),
                        },
                    },
                ],
            ]);
            const adapter = new MemorySharedLockAdapter(map);

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
