import { describe, test, expect, beforeEach } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { NotFoundExecutionContextError } from "@/execution-context/contracts/execution-context.errors.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/als-execution-context-adapter.js";
import { AsyncExecutionContext } from "@/execution-context/implementations/derivables/async-execution-context/async-execution-context.js";

describe("class: AsyncExecutionContext", () => {
    let context: AsyncExecutionContext;
    beforeEach(() => {
        context = new AsyncExecutionContext(new AlsExecutionContextAdapter());
    });

    describe("method: contains", () => {
        test("Should return false when array token does not exist", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(() => {
                return context.contains(token, 42);
            });

            expect(result).toBe(false);
        });

        test("Should return true when array contains matching value", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(async () => {
                await context.add(token, [1, 2, 3]);
                return await context.contains(token, 2);
            });

            expect(result).toBe(true);
        });

        test("Should return false when array does not contain value", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(async () => {
                await context.add(token, [1, 2, 3]);
                return await context.contains(token, 99);
            });

            expect(result).toBe(false);
        });

        test("Should work with predicate function", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(async () => {
                await context.add(token, [1, 2, 3, 4, 5]);
                return (
                    (await context.contains(token, (item) => item > 3)) &&
                    !(await context.contains(token, (item) => item > 10))
                );
            });

            expect(result).toBe(true);
        });

        test("Should work with async predicate function", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(async () => {
                await context.add(token, [1, 2, 3, 4, 5]);
                return await context.contains(token, async (item) => {
                    await Promise.resolve();
                    return item > 3;
                });
            });

            expect(result).toBe(true);
        });
    });

    describe("method: exists", () => {
        test("Should return false for non-existent token", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(() => {
                return context.exists(token);
            });

            expect(result).toBe(false);
        });

        test("Should return true for existing token", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.add(token, "John");
                return await context.exists(token);
            });

            expect(result).toBe(true);
        });

        test("Should return false outside run", async () => {
            const token = contextToken<string>("name");

            await expect(context.exists(token)).resolves.toBe(false);
        });
    });

    describe("method: missing", () => {
        test("Should return true for non-existent token", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(() => {
                return context.missing(token);
            });

            expect(result).toBe(true);
        });

        test("Should return false for existing token", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.add(token, "John");
                return await context.missing(token);
            });

            expect(result).toBe(false);
        });
    });

    describe("method: get", () => {
        test("Should return null for non-existent token", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(() => {
                return context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should return value for existing token", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "John");
                return await context.get(token);
            });

            expect(result).toBe("John");
        });

        test("Should return null outside run", async () => {
            const token = contextToken<string>("name");

            await expect(context.get(token)).resolves.toBeNull();
        });
    });

    describe("method: getOr", () => {
        test("Should return value when token exists", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "John");
                return await context.getOr(token, "default");
            });

            expect(result).toBe("John");
        });

        test("Should return default value when token is missing", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                return await context.getOr(token, "default");
            });

            expect(result).toBe("default");
        });

        test("Should support lazy default values", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                return await context.getOr(token, () => "lazy");
            });

            expect(result).toBe("lazy");
        });

        test("Should support async lazy default values", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                return await context.getOr(token, async () => {
                    await Promise.resolve();
                    return "lazy";
                });
            });

            expect(result).toBe("lazy");
        });

        test("Should only call lazy default when needed", async () => {
            const token = contextToken<string>("name");
            let called = false;

            const result = await context.run(async () => {
                await context.put(token, "value");
                return await context.getOr(token, () => {
                    called = true;
                    return "lazy";
                });
            });

            expect(result).toBe("value");
            expect(called).toBe(false);
        });
    });

    describe("method: getOrFail", () => {
        test("Should return value when token exists", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "John");
                return await context.getOrFail(token);
            });

            expect(result).toBe("John");
        });

        test("Should reject with NotFoundExecutionContextError when token is missing", async () => {
            const token = contextToken<string>("name");

            const result = context.run(() => {
                return context.getOrFail(token);
            });

            await expect(result).rejects.toThrow(NotFoundExecutionContextError);
        });

        test("Should reject outside run", async () => {
            const token = contextToken<string>("name");

            await expect(context.getOrFail(token)).rejects.toThrow(
                NotFoundExecutionContextError,
            );
        });
    });

    describe("method: add", () => {
        test("Should add a value", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.add(token, "John");
                return await context.get(token);
            });

            expect(result).toBe("John");
        });

        test("Should not overwrite existing values", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "existing");
                await context.add(token, "new");
                return await context.get(token);
            });

            expect(result).toBe("existing");
        });

        test("Should be a no-op outside run", async () => {
            const token = contextToken<string>("name");

            await context.add(token, "John");

            await expect(context.get(token)).resolves.toBeNull();
        });

        test("Should work with various types", async () => {
            const stringToken = contextToken<string>("string");
            const numberToken = contextToken<number>("number");
            const arrayToken = contextToken<Array<number>>("array");

            const result = await context.run(async () => {
                await context.add(stringToken, "text");
                await context.add(numberToken, 42);
                await context.add(arrayToken, [1, 2, 3]);

                return {
                    string: await context.get(stringToken),
                    number: await context.get(numberToken),
                    array: await context.get(arrayToken),
                };
            });

            expect(result).toEqual({
                string: "text",
                number: 42,
                array: [1, 2, 3],
            });
        });
    });

    describe("method: put", () => {
        test("Should set a value", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "John");
                return await context.get(token);
            });

            expect(result).toBe("John");
        });

        test("Should overwrite an existing value", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "existing");
                await context.put(token, "new");
                return await context.get(token);
            });

            expect(result).toBe("new");
        });

        test("Should support chaining", async () => {
            const token1 = contextToken<string>("key1");
            const token2 = contextToken<string>("key2");

            const result = await context.run(async () => {
                await context.put(token1, "value1").put(token2, "value2");
                return {
                    key1: await context.get(token1),
                    key2: await context.get(token2),
                };
            });

            expect(result).toEqual({ key1: "value1", key2: "value2" });
        });

        test("Should be a no-op outside run", async () => {
            const token = contextToken<string>("name");

            await context.put(token, "John");

            await expect(context.get(token)).resolves.toBeNull();
        });
    });

    describe("method: putIncrement", () => {
        test("Should initialize to initialValue when token does not exist", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.putIncrement(token, { initialValue: 10 });
                return await context.get(token);
            });

            expect(result).toBe(10);
        });

        test("Should increment by default value when token exists", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 5);
                await context.putIncrement(token);
                return await context.get(token);
            });

            expect(result).toBe(6);
        });

        test("Should increment by specified nbr value", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 5);
                await context.putIncrement(token, { nbr: 3 });
                return await context.get(token);
            });

            expect(result).toBe(8);
        });

        test("Should not exceed max value", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 10);
                await context.putIncrement(token, { max: 10 });
                return await context.get(token);
            });

            expect(result).toBe(10);
        });

        test("Should cap incremented value to max when exceeding", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 8);
                await context.putIncrement(token, { nbr: 5, max: 10 });
                return await context.get(token);
            });

            expect(result).toBe(10);
        });
    });

    describe("method: putDecrement", () => {
        test("Should initialize to initialValue when token does not exist", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.putDecrement(token, { initialValue: 10 });
                return await context.get(token);
            });

            expect(result).toBe(10);
        });

        test("Should decrement by default value when token exists", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 5);
                await context.putDecrement(token);
                return await context.get(token);
            });

            expect(result).toBe(4);
        });

        test("Should not go below min value", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 0);
                await context.putDecrement(token, { min: 0 });
                return await context.get(token);
            });

            expect(result).toBe(0);
        });
    });

    describe("method: putPush", () => {
        test("Should create an array when token does not exist", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(async () => {
                await context.putPush(token, 1, 2);
                return await context.get(token);
            });

            expect(result).toEqual([1, 2]);
        });

        test("Should append to an existing array", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(async () => {
                await context.put(token, [1, 2]);
                await context.putPush(token, 3, 4);
                return await context.get(token);
            });

            expect(result).toEqual([1, 2, 3, 4]);
        });
    });

    describe("method: update", () => {
        test("Should update an existing value", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "old");
                await context.update(token, "new");
                return await context.get(token);
            });

            expect(result).toBe("new");
        });

        test("Should not create a value when token does not exist", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.update(token, "value");
                return await context.get(token);
            });

            expect(result).toBeNull();
        });
    });

    describe("method: updateIncrement", () => {
        test("Should increment an existing value", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 5);
                await context.updateIncrement(token);
                return await context.get(token);
            });

            expect(result).toBe(6);
        });

        test("Should not create a value when token does not exist", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.updateIncrement(token);
                return await context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should cap incremented value to max", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 8);
                await context.updateIncrement(token, { nbr: 5, max: 10 });
                return await context.get(token);
            });

            expect(result).toBe(10);
        });
    });

    describe("method: updateDecrement", () => {
        test("Should decrement an existing value", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 5);
                await context.updateDecrement(token);
                return await context.get(token);
            });

            expect(result).toBe(4);
        });

        test("Should not create a value when token does not exist", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.updateDecrement(token);
                return await context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should not go below min value", async () => {
            const token = contextToken<number>("count");

            const result = await context.run(async () => {
                await context.put(token, 3);
                await context.updateDecrement(token, { nbr: 5, min: 0 });
                return await context.get(token);
            });

            expect(result).toBe(0);
        });
    });

    describe("method: updatePush", () => {
        test("Should append to an existing array", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(async () => {
                await context.put(token, [1, 2]);
                await context.updatePush(token, 3, 4);
                return await context.get(token);
            });

            expect(result).toEqual([1, 2, 3, 4]);
        });

        test("Should not create an array when token does not exist", async () => {
            const token = contextToken<Array<number>>("items");

            const result = await context.run(async () => {
                await context.updatePush(token, 1, 2);
                return await context.get(token);
            });

            expect(result).toBeNull();
        });
    });

    describe("method: remove", () => {
        test("Should remove an existing value", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "John");
                await context.remove(token);
                return await context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should remove only the specified token", async () => {
            const token1 = contextToken<string>("key1");
            const token2 = contextToken<string>("key2");

            const result = await context.run(async () => {
                await context.put(token1, "value1");
                await context.put(token2, "value2");
                await context.remove(token1);
                return {
                    key1: await context.get(token1),
                    key2: await context.get(token2),
                };
            });

            expect(result).toEqual({ key1: null, key2: "value2" });
        });
    });

    describe("method: when", () => {
        test("Should execute invocable when condition is true", async () => {
            const token = contextToken<number>("counter");

            const result = await context.run(async () => {
                await context.when(true, (ctx) => ctx.put(token, 42));
                return await context.get(token);
            });

            expect(result).toBe(42);
        });

        test("Should not execute invocable when condition is false", async () => {
            const token = contextToken<number>("counter");

            const result = await context.run(async () => {
                await context.when(false, (ctx) => ctx.put(token, 42));
                return await context.get(token);
            });

            expect(result).toBeNull();
        });

        test("Should evaluate condition lazily", async () => {
            const token = contextToken<number>("counter");

            const result = await context.run(async () => {
                let conditionEvaluated = false;
                await context.when(
                    () => {
                        conditionEvaluated = true;
                        return true;
                    },
                    (ctx) => ctx.put(token, 100),
                );
                return {
                    evaluated: conditionEvaluated,
                    value: await context.get(token),
                };
            });

            expect(result).toEqual({ evaluated: true, value: 100 });
        });

        test("Should support async conditions", async () => {
            const token = contextToken<number>("counter");

            const result = await context.run(async () => {
                await context.when(
                    async () => {
                        await Promise.resolve();
                        return true;
                    },
                    (ctx) => ctx.put(token, 100),
                );
                return await context.get(token);
            });

            expect(result).toBe(100);
        });

        test("Should execute multiple invocables in sequence", async () => {
            const token1 = contextToken<number>("count1");
            const token2 = contextToken<number>("count2");

            const result = await context.run(async () => {
                await context.when(
                    true,
                    (ctx) => ctx.put(token1, 10),
                    (ctx) => ctx.put(token2, 20),
                );

                return {
                    val1: await context.get(token1),
                    val2: await context.get(token2),
                };
            });

            expect(result).toEqual({ val1: 10, val2: 20 });
        });

        test("Should be a no-op outside run", async () => {
            const token = contextToken<number>("counter");

            await context.when(true, (ctx) => ctx.put(token, 42));

            await expect(context.get(token)).resolves.toBeNull();
        });
    });

    describe("method: run", () => {
        test("Should execute invocable and return its value", async () => {
            const result = await context.run(() => 42);

            expect(result).toBe(42);
        });

        test("Should await the invocable result", async () => {
            const result = await context.run(async () => {
                await Promise.resolve();
                return 42;
            });

            expect(result).toBe(42);
        });

        test("Should propagate context across await boundaries", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "John");
                await new Promise((resolve) => {
                    setTimeout(resolve, 5);
                });
                return await context.get(token);
            });

            expect(result).toBe("John");
        });

        test("Should isolate context between runs", async () => {
            const token = contextToken<number>("counter");

            await context.run(async () => {
                await context.put(token, 10);
            });

            const innerResult = await context.run(async () => {
                expect(await context.exists(token)).toBe(false);
                await context.put(token, 20);
                return await context.get(token);
            });

            expect(innerResult).toBe(20);

            const outerResult = await context.run(() => {
                return context.get(token);
            });

            expect(outerResult).toBeNull();
        });

        test("Should allow inner run to see outer context values at start", async () => {
            const token = contextToken<number>("counter");

            const result = await context.run(async () => {
                await context.put(token, 5);

                const innerResult = await context.run(async () => {
                    expect(await context.get(token)).toBe(5);
                    await context.update(token, 15);
                    return await context.get(token);
                });

                return {
                    inner: innerResult,
                    outer: await context.get(token),
                };
            });

            expect(result).toEqual({ inner: 15, outer: 5 });
        });

        test("Should maintain separate contexts for nested runs", async () => {
            const token = contextToken<number>("counter");

            const result = await context.run(async () => {
                await context.put(token, 1);

                const innerResult1 = await context.run(async () => {
                    await context.update(token, 2);

                    const innerResult2 = await context.run(async () => {
                        await context.update(token, 3);
                        return await context.get(token);
                    });

                    return {
                        afterInner: await context.get(token),
                        innerVal: innerResult2,
                    };
                });

                return {
                    afterNested: await context.get(token),
                    nested: innerResult1,
                };
            });

            expect(result).toEqual({
                afterNested: 1,
                nested: {
                    afterInner: 2,
                    innerVal: 3,
                },
            });
        });
    });

    describe("integration: method chaining", () => {
        test("Should support chaining multiple operations", async () => {
            const token1 = contextToken<string>("name");
            const token2 = contextToken<number>("count");
            const token3 = contextToken<Array<string>>("items");

            const result = await context.run(async () => {
                await context
                    .put(token1, "test")
                    .put(token2, 5)
                    .putPush(token3, "a", "b")
                    .update(token2, 10)
                    .updatePush(token3, "c");

                return {
                    name: await context.get(token1),
                    count: await context.get(token2),
                    items: await context.get(token3),
                };
            });

            expect(result).toEqual({
                name: "test",
                count: 10,
                items: ["a", "b", "c"],
            });
        });

        test("Should support complex workflows", async () => {
            const userCountToken = contextToken<number>("userCount");
            const activeUsersToken = contextToken<Array<string>>("activeUsers");
            const maxUsersToken = contextToken<number>("maxUsers");

            const result = await context.run(async () => {
                await context
                    .put(maxUsersToken, 100)
                    .put(userCountToken, 0)
                    .put(activeUsersToken, [])
                    .when((await context.getOrFail(maxUsersToken)) > 0, (ctx) =>
                        ctx
                            .putIncrement(userCountToken)
                            .putPush(activeUsersToken, "user1"),
                    )
                    .when(
                        async () =>
                            (await context.getOrFail(userCountToken)) < 10,
                        (ctx) =>
                            ctx
                                .putIncrement(userCountToken)
                                .putPush(activeUsersToken, "user2"),
                    );

                return {
                    userCount: await context.get(userCountToken),
                    activeUsers: await context.get(activeUsersToken),
                };
            });

            expect(result).toEqual({
                userCount: 2,
                activeUsers: ["user1", "user2"],
            });
        });
    });

    describe("context scopes: run", () => {
        test("Should create isolated scopes between consecutive runs", async () => {
            const token = contextToken<number>("value");

            const first = await context.run(async () => {
                await context.put(token, 10);
                return await context.get(token);
            });

            const second = await context.run(() => {
                return context.get(token);
            });

            expect(first).toBe(10);
            expect(second).toBeNull();
        });

        test("Should inherit outer context values at run start", async () => {
            const token = contextToken<string>("name");

            const result = await context.run(async () => {
                await context.put(token, "outer");

                return await context.run(() => {
                    return context.get(token);
                });
            });

            expect(result).toBe("outer");
        });

        test("Should not leak inner context modifications to outer scope", async () => {
            const token = contextToken<number>("counter");

            const result = await context.run(async () => {
                await context.put(token, 0);

                await context.run(async () => {
                    await context.update(token, 100);
                });

                return await context.get(token);
            });

            expect(result).toBe(0);
        });

        test("Should maintain independent snapshots in nested runs", async () => {
            const token = contextToken<number>("value");

            const results = await context.run(async () => {
                await context.put(token, 1);

                const inner1 = await context.run(async () => {
                    await context.update(token, 10);
                    return await context.get(token);
                });

                const inner2 = await context.run(() => {
                    return context.get(token);
                });

                const outer = await context.get(token);

                return { inner1, inner2, outer };
            });

            expect(results).toEqual({ inner1: 10, inner2: 1, outer: 1 });
        });
    });

    describe("nested context scopes: run depth levels", () => {
        test("Maintains isolation with three levels of nesting", async () => {
            const token = contextToken<number>("value");

            const result = await context.run(async () => {
                await context.put(token, 1);

                return await context.run(async () => {
                    await context.update(token, 2);

                    return await context.run(async () => {
                        await context.update(token, 3);
                        return await context.get(token);
                    });
                });
            });

            expect(result).toBe(3);
        });

        test("Restores outer values after nested runs complete", async () => {
            const token = contextToken<number>("value");

            const result = await context.run(async () => {
                await context.put(token, 1);

                await context.run(async () => {
                    await context.update(token, 2);
                });

                return await context.get(token);
            });

            expect(result).toBe(1);
        });
    });

    describe("no-op behavior: outside run context", () => {
        test("Should not store values outside run", async () => {
            const token = contextToken<string>("name");

            await context.put(token, "John");

            await expect(context.exists(token)).resolves.toBe(false);
            await expect(context.get(token)).resolves.toBeNull();
        });

        test("Should not throw when removing outside run", async () => {
            const token = contextToken<string>("name");

            await expect(context.remove(token)).resolves.toBeUndefined();
        });

        test("Should not throw when incrementing outside run", async () => {
            const token = contextToken<number>("count");

            await expect(context.putIncrement(token)).resolves.toBeUndefined();
            await expect(context.get(token)).resolves.toBeNull();
        });
    });
});
