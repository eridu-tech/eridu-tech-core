import { describe, expect, test, vi } from "vitest";

import { QueuePool } from "@/generic-pool/implementations/queue-pool/_module.js";

import type { Mock } from "vitest";

type TClient = {
    id: number;
};

type TResourceFactorySpies = {
    create: Mock<() => Promise<TClient>>;
    destroy: Mock<(client: TClient) => Promise<void>>;
    created: Array<TClient>;
};

function createFactorySpies(): TResourceFactorySpies {
    const created: Array<TClient> = [];
    return {
        created,
        create: vi.fn(() => {
            const client: TClient = { id: created.length + 1 };
            created.push(client);
            return Promise.resolve(client);
        }),
        destroy: vi.fn((_client: TClient) => Promise.resolve()),
    };
}

async function flushTasks(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

async function captureError(promise: Promise<unknown>): Promise<Error> {
    try {
        await promise;
    } catch (error: unknown) {
        if (error instanceof Error) {
            return error;
        }
        throw new Error("Expected the promise to reject with an Error");
    }
    throw new Error("Expected the promise to reject");
}

describe("class: QueuePool", () => {
    describe("constructor", () => {
        test("Should throw when maxResources is not a positive integer", () => {
            const { create, destroy } = createFactorySpies();

            expect(
                () => new QueuePool({ create, destroy }, { maxResources: 0 }),
            ).toThrow("maxResources must be an integer larger than 0");
            expect(
                () => new QueuePool({ create, destroy }, { maxResources: 1.5 }),
            ).toThrow("maxResources must be an integer larger than 0");
        });
        test("Should throw when maxWaitSize is not a non-negative integer", () => {
            const { create, destroy } = createFactorySpies();

            expect(
                () => new QueuePool({ create, destroy }, { maxWaitSize: -1 }),
            ).toThrow("maxWaitSize must be a non-negative integer or null");
            expect(
                () => new QueuePool({ create, destroy }, { maxWaitSize: 1.5 }),
            ).toThrow("maxWaitSize must be a non-negative integer or null");
        });
    });
    describe("method: acquireOrFail", () => {
        test("Should create a client when the pool is empty", async () => {
            const { create, destroy, created } = createFactorySpies();
            const pool = new QueuePool({ create, destroy });

            const client = await pool.acquireOrFail();

            expect(client).toBe(created[0]);
            expect(create).toHaveBeenCalledOnce();
        });
        test("Should create at most maxResources clients", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 2 },
            );

            const first = await pool.acquireOrFail();
            const second = await pool.acquireOrFail();

            let isThirdResolved = false;
            const thirdPromise = pool
                .acquireOrFail()
                .finally(() => (isThirdResolved = true));

            await flushTasks();

            expect(create).toHaveBeenCalledTimes(2);
            expect(isThirdResolved).toBe(false);

            await pool.release(first);

            await expect(thirdPromise).resolves.toBe(first);
            expect(create).toHaveBeenCalledTimes(2);
            expect(second).not.toBe(first);
        });
        test("Should reuse a released client", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool({ create, destroy });

            const first = await pool.acquireOrFail();
            await pool.release(first);
            const second = await pool.acquireOrFail();

            expect(second).toBe(first);
            expect(create).toHaveBeenCalledOnce();
        });
        test("Should reuse idle clients in a first-in-first-out order", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 2 },
            );

            const first = await pool.acquireOrFail();
            const second = await pool.acquireOrFail();

            await pool.release(first);
            await pool.release(second);

            await expect(pool.acquireOrFail()).resolves.toBe(first);
            await expect(pool.acquireOrFail()).resolves.toBe(second);
            expect(create).toHaveBeenCalledTimes(2);
        });
        test("Should serve waiting callers in a first-in-first-out order", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();

            let isThirdResolved = false;
            const secondPromise = pool.acquireOrFail();
            const thirdPromise = pool
                .acquireOrFail()
                .finally(() => (isThirdResolved = true));

            await flushTasks();

            await pool.release(client);

            await expect(secondPromise).resolves.toBe(client);
            await flushTasks();
            expect(isThirdResolved).toBe(false);

            await pool.release(client);

            await expect(thirdPromise).resolves.toBe(client);
        });
        test("Should fail when the wait queue is full", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1, maxWaitSize: 1 },
            );

            const client = await pool.acquireOrFail();
            const waitingPromise = pool.acquireOrFail();
            const fullQueueError = captureError(pool.acquireOrFail());

            expect((await fullQueueError).message).toBe(
                "Cannot wait for a client, the wait queue has reached its limit of 1 callers",
            );

            await pool.release(client);

            await expect(waitingPromise).resolves.toBe(client);
        });
        test("Should fail immediately when maxWaitSize is 0", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1, maxWaitSize: 0 },
            );

            const client = await pool.acquireOrFail();

            await expect(pool.acquireOrFail()).rejects.toThrow(
                "wait queue has reached its limit of 0 callers",
            );
            await pool.release(client);
        });
        test("Should queue callers without a limit when maxWaitSize is null", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1, maxWaitSize: null },
            );

            const client = await pool.acquireOrFail();
            const second = pool.acquireOrFail();
            const third = pool.acquireOrFail();
            const fourth = pool.acquireOrFail();

            await flushTasks();
            expect(create).toHaveBeenCalledOnce();

            await pool.release(client);
            await expect(second).resolves.toBe(client);

            await pool.release(client);
            await expect(third).resolves.toBe(client);

            await pool.release(client);
            await expect(fourth).resolves.toBe(client);

            expect(create).toHaveBeenCalledOnce();
        });
        test("Should destroy invalid clients and create a replacement", async () => {
            const { create, destroy, created } = createFactorySpies();
            const validate = vi.fn((_client: TClient) =>
                Promise.resolve(false),
            );
            const pool = new QueuePool(
                { create, destroy, validate },
                { maxResources: 1 },
            );

            const first = await pool.acquireOrFail();
            await pool.release(first);
            const second = await pool.acquireOrFail();

            expect(validate).toHaveBeenCalledExactlyOnceWith(first);
            expect(destroy).toHaveBeenCalledExactlyOnceWith(first);
            expect(second).not.toBe(first);
            expect(second).toBe(created[1]);
        });
        test("Should destroy a client when validate throws", async () => {
            const { create, destroy } = createFactorySpies();
            const validate = vi.fn((_client: TClient) =>
                Promise.reject(new Error("Invalid client")),
            );
            const pool = new QueuePool(
                { create, destroy, validate },
                { maxResources: 1 },
            );

            const first = await pool.acquireOrFail();
            await pool.release(first);
            const second = await pool.acquireOrFail();

            expect(destroy).toHaveBeenCalledExactlyOnceWith(first);
            expect(second).not.toBe(first);
        });
        test("Should propagate creation failures and let a waiting caller retry", async () => {
            const client: TClient = { id: 1 };
            let rejectCreation: ((error: unknown) => void) | undefined;
            const create = vi
                .fn<() => Promise<TClient>>()
                .mockImplementationOnce(
                    () =>
                        new Promise<TClient>((_resolve, reject) => {
                            rejectCreation = reject;
                        }),
                )
                .mockResolvedValue(client);
            const destroy = vi.fn((_client: TClient) => Promise.resolve());
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const failingAcquire = pool.acquireOrFail();
            const waitingAcquire = pool.acquireOrFail();
            const failingErrorPromise = failingAcquire.catch(
                (error: unknown) => error,
            );

            await flushTasks();
            expect(rejectCreation).toBeTypeOf("function");
            if (rejectCreation !== undefined) {
                rejectCreation(new Error("Creation failed"));
            }

            expect(await failingErrorPromise).toBeInstanceOf(Error);
            await expect(waitingAcquire).resolves.toBe(client);
            expect(create).toHaveBeenCalledTimes(2);
        });
        test("Should fail when the pool is closed", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool({ create, destroy });

            await pool.close();

            await expect(pool.acquireOrFail()).rejects.toThrow(
                "Cannot acquire a client from a closed pool",
            );
            expect(create).not.toHaveBeenCalled();
        });
    });
    describe("method: release", () => {
        test("Should hand the client to the next waiting caller", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();
            const waitingPromise = pool.acquireOrFail();

            await flushTasks();
            await pool.release(client);

            await expect(waitingPromise).resolves.toBe(client);
        });
        test("Should serve a caller that begins waiting after the client was released", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();
            const waitingPromise = pool.acquireOrFail();

            await pool.release(client);

            await expect(waitingPromise).resolves.toBe(client);
            expect(create).toHaveBeenCalledOnce();
        });
        test("Should ignore clients that were not acquired from the pool", async () => {
            const { create, destroy, created } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            await pool.release({ id: 999 });
            const client = await pool.acquireOrFail();

            expect(client).toBe(created[0]);
            expect(destroy).not.toHaveBeenCalled();
        });
        test("Should ignore a repeated release", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();
            await pool.release(client);

            const waitingPromise = pool.acquireOrFail();
            await flushTasks();
            await pool.release(client);

            await expect(waitingPromise).resolves.toBe(client);
            expect(create).toHaveBeenCalledOnce();
        });
        test("Should validate the client that is handed to a waiting caller", async () => {
            const { create, destroy, created } = createFactorySpies();
            const validate = vi.fn((_client: TClient) =>
                Promise.resolve(false),
            );
            const pool = new QueuePool(
                { create, destroy, validate },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();
            const waitingPromise = pool.acquireOrFail();

            await flushTasks();
            await pool.release(client);

            const replacement = await waitingPromise;
            expect(replacement).toBe(created[1]);
            expect(replacement).not.toBe(client);
            expect(validate).toHaveBeenCalledExactlyOnceWith(client);
            expect(destroy).toHaveBeenCalledExactlyOnceWith(client);
        });
    });
    describe("method: run", () => {
        test("Should return the invocable result and release the client", async () => {
            const { create, destroy, created } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const result = await pool.run((client) =>
                Promise.resolve(client.id + 41),
            );
            const client = await pool.acquireOrFail();

            expect(result).toBe(42);
            expect(client).toBe(created[0]);
            expect(create).toHaveBeenCalledOnce();
        });
        test("Should release the client when the invocable throws", async () => {
            const { create, destroy, created } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            await expect(
                pool.run(() => {
                    throw new Error("Handler failed");
                }),
            ).rejects.toThrow("Handler failed");

            const client = await pool.acquireOrFail();

            expect(client).toBe(created[0]);
            expect(create).toHaveBeenCalledOnce();
        });
    });
    describe("method: close", () => {
        test("Should destroy idle clients", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();
            await pool.release(client);
            await pool.close();

            expect(destroy).toHaveBeenCalledExactlyOnceWith(client);
        });
        test("Should reject waiting callers", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();
            const waitingError = captureError(pool.acquireOrFail());

            await flushTasks();
            await pool.close();

            expect((await waitingError).message).toBe(
                "Cannot acquire a client from a closed pool",
            );
            await pool.release(client);
        });
        test("Should be idempotent", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();
            await pool.release(client);

            await pool.close();
            await pool.close();

            expect(destroy).toHaveBeenCalledExactlyOnceWith(client);
        });
        test("Should destroy clients that are released after closing", async () => {
            const { create, destroy } = createFactorySpies();
            const pool = new QueuePool(
                { create, destroy },
                { maxResources: 1 },
            );

            const client = await pool.acquireOrFail();
            await pool.close();
            await pool.release(client);

            expect(destroy).toHaveBeenCalledExactlyOnceWith(client);
            await expect(pool.acquireOrFail()).rejects.toThrow(
                "Cannot acquire a client from a closed pool",
            );
        });
        test("Should destroy a client that finishes creating after closing", async () => {
            const client: TClient = { id: 1 };
            let resolveCreation: ((createdClient: TClient) => void) | undefined;
            const create = vi
                .fn<() => Promise<TClient>>()
                .mockImplementationOnce(
                    () =>
                        new Promise<TClient>((resolve) => {
                            resolveCreation = resolve;
                        }),
                );
            const destroy = vi.fn((_client: TClient) => Promise.resolve());
            const pool = new QueuePool({ create, destroy });

            const acquireError = captureError(pool.acquireOrFail());

            await flushTasks();
            await pool.close();
            if (resolveCreation !== undefined) {
                resolveCreation(client);
            }

            expect((await acquireError).message).toBe(
                "Cannot acquire a client from a closed pool",
            );
            expect(destroy).toHaveBeenCalledExactlyOnceWith(client);
        });
    });
});
