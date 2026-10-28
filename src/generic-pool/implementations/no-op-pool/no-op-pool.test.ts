import { describe, expect, test, vi } from "vitest";

import { NoOpPool } from "@/generic-pool/implementations/no-op-pool/_module.js";

describe("class: NoOpPool", () => {
    describe("method: acquireOrFail", () => {
        test("Should return the same client on every call", async () => {
            const client = { query: () => Promise.resolve([]) };
            const destroy = vi.fn(() => Promise.resolve());
            const pool = new NoOpPool({ client, destroy });

            const firstClient = await pool.acquireOrFail();
            const secondClient = await pool.acquireOrFail();

            expect(firstClient).toBe(client);
            expect(secondClient).toBe(client);
            expect(destroy).not.toHaveBeenCalled();
        });
    });
    describe("method: release", () => {
        test("Should resolve without destroying the client", async () => {
            const client = { query: () => Promise.resolve([]) };
            const destroy = vi.fn(() => Promise.resolve());
            const pool = new NoOpPool({ client, destroy });

            await expect(pool.release(client)).resolves.toBeUndefined();

            expect(destroy).not.toHaveBeenCalled();
        });
    });
    describe("method: run", () => {
        test("Should call the invocable once with the client and return its result", async () => {
            const client = { query: () => Promise.resolve([]) };
            const invocable = vi.fn(() => Promise.resolve("result"));
            const pool = new NoOpPool({
                client,
                destroy: () => Promise.resolve(),
            });

            const result = await pool.run(invocable);

            expect(result).toBe("result");
            expect(invocable).toHaveBeenCalledExactlyOnceWith(client);
        });
        test("Should support an invocable object", async () => {
            const client = { query: () => Promise.resolve([]) };
            const invocable = { invoke: vi.fn(() => "result") };
            const pool = new NoOpPool({
                client,
                destroy: () => Promise.resolve(),
            });

            const result = await pool.run(invocable);

            expect(result).toBe("result");
            expect(invocable.invoke).toHaveBeenCalledExactlyOnceWith(client);
        });
    });
    describe("method: close", () => {
        test("Should call destroy once with the client", async () => {
            const client = { query: () => Promise.resolve([]) };
            const destroy = vi.fn(() => Promise.resolve());
            const pool = new NoOpPool({ client, destroy });

            await pool.close();

            expect(destroy).toHaveBeenCalledExactlyOnceWith(client);
        });
    });
});
