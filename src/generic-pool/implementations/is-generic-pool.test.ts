import { describe, expect, test } from "vitest";

import { isGenericPool } from "@/generic-pool/implementations/is-generic-pool.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type { IGenericPoolRunner } from "@/generic-pool/contracts/_module-exports.js";

describe("function: isGenericPool", () => {
    test("Should return true when IGenericPool", () => {
        const pool: IGenericPoolRunner<string> = {
            run: (invocable) =>
                Promise.resolve(callInvocable(invocable, "client")),
            acquireOrFail: () => Promise.resolve("client"),
            release: () => Promise.resolve(),
        };

        const result = isGenericPool(pool);

        expect(result).toBe(true);
    });
    test("Should return false when not IGenericPool", () => {
        const client = { query: () => Promise.resolve([]) };

        const result = isGenericPool<unknown>(client);

        expect(result).toBe(false);
    });
});
