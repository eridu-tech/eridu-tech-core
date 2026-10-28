import { describe, expect, test, vi } from "vitest";

import { resolvePoolable } from "@/generic-pool/implementations/resolve-poolable.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type { IGenericPoolBase } from "@/generic-pool/contracts/_module-exports.js";

describe("function: resolvePoolable", () => {
    test("Should return the same pool when IGenericPool", () => {
        const pool: IGenericPoolBase<string> = {
            run: (invocable) =>
                Promise.resolve(callInvocable(invocable, "client")),
            acquireOrFail: () => Promise.resolve("client"),
            release: () => Promise.resolve(),
        };
        const poolFactory =
            vi.fn<(client_: string) => IGenericPoolBase<string>>();

        const result = resolvePoolable(pool, poolFactory);

        expect(result).toBe(pool);
        expect(poolFactory).not.toHaveBeenCalled();
    });
    test("Should create a pool when not IGenericPool", () => {
        const client = { query: () => Promise.resolve([]) };
        const pool: IGenericPoolBase<typeof client> = {
            run: (invocable) =>
                Promise.resolve(callInvocable(invocable, client)),
            acquireOrFail: () => Promise.resolve(client),
            release: () => Promise.resolve(),
        };
        const poolFactory = vi.fn<
            (client_: typeof client) => IGenericPoolBase<typeof client>
        >(() => pool);

        const result = resolvePoolable(client, poolFactory);

        expect(result).toBe(pool);
        expect(poolFactory).toHaveBeenCalledExactlyOnceWith(client);
    });
});
