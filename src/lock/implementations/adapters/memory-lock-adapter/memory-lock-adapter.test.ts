import { beforeEach, describe, expect, test } from "vitest";

import { MemoryLockAdapter } from "@/lock/implementations/adapters/memory-lock-adapter/_module-exports.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module-exports.js";

import type { ILockAdapterState } from "@/lock/contracts/_module-exports.js";

const EXPIRED_AT = (): Date => new Date(Date.now() - 1_000);
const FUTURE_AT = (): Date => new Date(Date.now() + 300_000);

describe("class: MemoryLockAdapter", { tags: ["Memory"] }, () => {
    lockAdapterTestSuite({
        createAdapter: () => new MemoryLockAdapter(),
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove expired locks", async () => {
            const map = new Map<string, ILockAdapterState>([
                ["expired", { owner: "1", expiration: EXPIRED_AT() }],
            ]);
            const adapter = new MemoryLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("expired")).toBe(false);
        });
        test("Should keep unexpired locks", async () => {
            const map = new Map<string, ILockAdapterState>([
                ["unexpired", { owner: "3", expiration: FUTURE_AT() }],
            ]);
            const adapter = new MemoryLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("unexpired")).toBe(true);
        });
        test("Should keep unexpireable locks", async () => {
            const map = new Map<string, ILockAdapterState>([
                ["unexpireable", { owner: "2", expiration: null }],
            ]);
            const adapter = new MemoryLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.has("unexpireable")).toBe(true);
        });
        test("Should not remove any locks when none are expired", async () => {
            const map = new Map<string, ILockAdapterState>([
                ["unexpireable", { owner: "1", expiration: null }],
                ["unexpired", { owner: "2", expiration: FUTURE_AT() }],
            ]);
            const adapter = new MemoryLockAdapter(map);

            await adapter.removeAllExpired();

            expect(map.size).toBe(2);
            expect(map.has("unexpireable")).toBe(true);
            expect(map.has("unexpired")).toBe(true);
        });
    });
    describe("method: deInit", () => {
        test("Should clear map", async () => {
            const map = new Map<string, ILockAdapterState>([
                ["a", { owner: "1", expiration: null }],
                ["b", { owner: "2", expiration: EXPIRED_AT() }],
                ["c", { owner: "3", expiration: FUTURE_AT() }],
            ]);
            const adapter = new MemoryLockAdapter(map);

            await adapter.deInit();

            expect(map.size).toBe(0);
        });
    });
});
