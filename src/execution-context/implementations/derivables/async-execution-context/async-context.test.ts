import { describe, expect, test, beforeEach } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { NotFoundExecutionContextError } from "@/execution-context/contracts/execution-context.errors.js";
import { AsyncContext } from "@/execution-context/implementations/derivables/async-execution-context/async-context.js";

describe("class: AsyncContext", () => {
    let context: AsyncContext;

    beforeEach(() => {
        context = new AsyncContext(new Map());
    });

    describe("method: copy", () => {
        test("Should create a deep copy of the context", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            const copied = context.copy();

            await expect(copied.get(token)).resolves.toBe("value");
        });

        test("Should not share the same map with the original context", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            const copied = context.copy();
            await copied.put(token, "modified");

            await expect(context.get(token)).resolves.toBe("value");
            await expect(copied.get(token)).resolves.toBe("modified");
        });

        test("Should create independent copies when modifying arrays", async () => {
            const token = contextToken<Array<number>>("numbers");
            await context.put(token, [1, 2, 3]);

            const copied = context.copy();
            await copied.putPush(token, 4);

            await expect(context.get(token)).resolves.toEqual([1, 2, 3]);
            await expect(copied.get(token)).resolves.toEqual([1, 2, 3, 4]);
        });

        test("Should isolate copied context from direct array mutations", async () => {
            const token = contextToken<Array<number>>("numbers");
            await context.put(token, [1, 2, 3]);

            const copied = context.copy();
            // Direct mutation of the array in the copy
            (await copied.get(token))?.push(4);

            // Original should be unaffected due to deep cloning
            await expect(context.get(token)).resolves.toEqual([1, 2, 3]);
            await expect(copied.get(token)).resolves.toEqual([1, 2, 3, 4]);
        });
    });

    describe("method: contains", () => {
        test("Should verify array storage works", async () => {
            const token = contextToken<Array<string>>("names");
            await context.put(token, ["alice", "bob", "charlie"]);

            const stored = await context.get(token);
            expect(stored).not.toBeNull();
            expect(Array.isArray(stored)).toBe(true);
            expect(stored).toEqual(["alice", "bob", "charlie"]);
        });

        test("Should return true when array contains matching value", async () => {
            const token = contextToken<Array<string>>("names");
            await context.put(token, ["alice", "bob", "charlie"]);

            await expect(context.contains(token, "bob")).resolves.toBe(true);
        });

        test("Should return false when array does not contain matching value", async () => {
            const token = contextToken<Array<string>>("names");
            await context.put(token, ["alice", "bob", "charlie"]);

            await expect(context.contains(token, "dave")).resolves.toBe(false);
        });

        test("Should return false when token does not exist", async () => {
            const token = contextToken<Array<string>>("nonexistent");

            await expect(context.contains(token, "value")).resolves.toBe(false);
        });

        test("Should work with custom predicate function", async () => {
            const token = contextToken<Array<number>>("numbers");
            await context.put(token, [1, 2, 3, 4, 5]);

            await expect(context.contains(token, (n) => n > 3)).resolves.toBe(
                true,
            );
            await expect(context.contains(token, (n) => n > 10)).resolves.toBe(
                false,
            );
        });

        test("Should work with async predicate function", async () => {
            const token = contextToken<Array<number>>("numbers");
            await context.put(token, [1, 2, 3, 4, 5]);

            await expect(
                context.contains(token, async (n) => {
                    await Promise.resolve();
                    return n > 3;
                }),
            ).resolves.toBe(true);
            await expect(
                context.contains(token, async (n) => {
                    await Promise.resolve();
                    return n > 10;
                }),
            ).resolves.toBe(false);
        });

        test("Should work with different types", async () => {
            const token =
                contextToken<Array<{ id: number; name: string }>>("objects");
            await context.put(token, [
                { id: 1, name: "first" },
                { id: 2, name: "second" },
            ]);

            await expect(
                context.contains(token, (obj) => obj.id === 2),
            ).resolves.toBe(true);
        });
    });

    describe("method: exists", () => {
        test("Should return true when token exists", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            await expect(context.exists(token)).resolves.toBe(true);
        });

        test("Should return false when token does not exist", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(context.exists(token)).resolves.toBe(false);
        });

        test("Should return true even when value is falsy", async () => {
            const token = contextToken<boolean>("falsy");
            await context.put(token, false);

            await expect(context.exists(token)).resolves.toBe(true);
        });

        test("Should return true when value is null", async () => {
            const token = contextToken<string | null>("nullable");
            await context.put(token, null as string | null);

            await expect(context.exists(token)).resolves.toBe(true);
        });
    });

    describe("method: missing", () => {
        test("Should return true when token does not exist", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(context.missing(token)).resolves.toBe(true);
        });

        test("Should return false when token exists", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            await expect(context.missing(token)).resolves.toBe(false);
        });

        test("Should return false even when value is falsy", async () => {
            const token = contextToken<boolean>("falsy");
            await context.put(token, false);

            await expect(context.missing(token)).resolves.toBe(false);
        });
    });

    describe("method: get", () => {
        test("Should return the value when token exists", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            await expect(context.get(token)).resolves.toBe("value");
        });

        test("Should return null when token does not exist", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(context.get(token)).resolves.toBeNull();
        });

        test("Should return the actual value when it is falsy", async () => {
            const token = contextToken<boolean>("falsy");
            await context.put(token, false);

            await expect(context.get(token)).resolves.toBe(false);
        });

        test("Should return null for explicitly set null values", async () => {
            const token = contextToken<string | null>("nullable");
            await context.put(token, null as string | null);

            await expect(context.get(token)).resolves.toBeNull();
        });
    });

    describe("method: getOr", () => {
        test("Should return the value when token exists", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            await expect(context.getOr(token, "default")).resolves.toBe(
                "value",
            );
        });

        test("Should return the default value when token does not exist", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(context.getOr(token, "default")).resolves.toBe(
                "default",
            );
        });

        test("Should return the value even when it is falsy", async () => {
            const token = contextToken<boolean>("falsy");
            await context.put(token, false);

            await expect(context.getOr(token, true)).resolves.toBe(false);
        });

        test("Should support lazy default values", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(context.getOr(token, () => "lazy")).resolves.toBe(
                "lazy",
            );
        });

        test("Should support async lazy default values", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(
                context.getOr(token, async () => {
                    await Promise.resolve();
                    return "lazy";
                }),
            ).resolves.toBe("lazy");
        });

        test("Should only call lazy default when needed", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            let called = false;
            const result = await context.getOr(token, () => {
                called = true;
                return "lazy";
            });

            expect(result).toBe("value");
            expect(called).toBe(false);
        });
    });

    describe("method: getOrFail", () => {
        test("Should return the value when token exists", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            await expect(context.getOrFail(token)).resolves.toBe("value");
        });

        test("Should reject with NotFoundExecutionContextError when token does not exist", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(context.getOrFail(token)).rejects.toThrow(
                NotFoundExecutionContextError,
            );
        });

        test("Should reject with the correct token id in the error", async () => {
            const token = contextToken<string>("myKey");

            await expect(context.getOrFail(token)).rejects.toThrow(/"myKey"/u);
        });
    });

    describe("method: add", () => {
        test("Should add a value when token does not exist", async () => {
            const token = contextToken<string>("key");

            await context.add(token, "value");

            await expect(context.get(token)).resolves.toBe("value");
        });

        test("Should not overwrite an existing value", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "existing");

            await context.add(token, "new");

            await expect(context.get(token)).resolves.toBe("existing");
        });

        test("Should return a chain that resolves with void", async () => {
            const token = contextToken<string>("key");

            await expect(context.add(token, "value")).resolves.toBeUndefined();
        });

        test("Should work with various types", async () => {
            const stringToken = contextToken<string>("string");
            const numberToken = contextToken<number>("number");
            const arrayToken = contextToken<Array<number>>("array");

            await context.add(stringToken, "text");
            await context.add(numberToken, 42);
            await context.add(arrayToken, [1, 2, 3]);

            await expect(context.get(stringToken)).resolves.toBe("text");
            await expect(context.get(numberToken)).resolves.toBe(42);
            await expect(context.get(arrayToken)).resolves.toEqual([1, 2, 3]);
        });
    });

    describe("method: put", () => {
        test("Should set a value when token does not exist", async () => {
            const token = contextToken<string>("key");

            await context.put(token, "value");

            await expect(context.get(token)).resolves.toBe("value");
        });

        test("Should overwrite an existing value", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "existing");

            await context.put(token, "new");

            await expect(context.get(token)).resolves.toBe("new");
        });

        test("Should return a chain that exposes the context methods", async () => {
            const token = contextToken<string>("key");

            await expect(context.put(token, "value").get(token)).resolves.toBe(
                "value",
            );
        });
    });

    describe("method: putIncrement", () => {
        test("Should initialize to initialValue when token does not exist", async () => {
            const token = contextToken<number>("count");

            await context.putIncrement(token, { initialValue: 0 });

            await expect(context.get(token)).resolves.toBe(0);
        });

        test("Should increment by default value when token exists", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 5);

            await context.putIncrement(token);

            await expect(context.get(token)).resolves.toBe(6);
        });

        test("Should increment by specified nbr value", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 5);

            await context.putIncrement(token, { nbr: 3 });

            await expect(context.get(token)).resolves.toBe(8);
        });

        test("Should not exceed max value", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 10);

            await context.putIncrement(token, { max: 10 });

            await expect(context.get(token)).resolves.toBe(10);
        });

        test("Should increment to max value when below max", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 8);

            await context.putIncrement(token, { nbr: 5, max: 10 });

            await expect(context.get(token)).resolves.toBe(10);
        });

        test("Should use initialValue when token does not exist", async () => {
            const token = contextToken<number>("count");

            await context.putIncrement(token, { initialValue: 10 });

            await expect(context.get(token)).resolves.toBe(10);
        });

        test("Should cap initialValue to max when token does not exist", async () => {
            const token = contextToken<number>("count");

            await context.putIncrement(token, { initialValue: 15, max: 10 });

            await expect(context.get(token)).resolves.toBe(10);
        });
    });

    describe("method: putDecrement", () => {
        test("Should initialize to initialValue when token does not exist", async () => {
            const token = contextToken<number>("count");

            await context.putDecrement(token, { initialValue: 10 });

            await expect(context.get(token)).resolves.toBe(10);
        });

        test("Should decrement by default value when token exists", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 5);

            await context.putDecrement(token);

            await expect(context.get(token)).resolves.toBe(4);
        });

        test("Should decrement by specified nbr value", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 10);

            await context.putDecrement(token, { nbr: 3 });

            await expect(context.get(token)).resolves.toBe(7);
        });

        test("Should not go below min value", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 0);

            await context.putDecrement(token, { min: 0 });

            await expect(context.get(token)).resolves.toBe(0);
        });

        test("Should decrement to min value when below min", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 3);

            await context.putDecrement(token, { nbr: 5, min: 0 });

            await expect(context.get(token)).resolves.toBe(0);
        });

        test("Should floor initialValue to min when token does not exist", async () => {
            const token = contextToken<number>("count");

            await context.putDecrement(token, { initialValue: -5, min: 0 });

            await expect(context.get(token)).resolves.toBe(0);
        });
    });

    describe("method: putPush", () => {
        test("Should create an array when token does not exist", async () => {
            const token = contextToken<Array<number>>("items");

            await context.putPush(token, 1, 2);

            await expect(context.get(token)).resolves.toEqual([1, 2]);
        });

        test("Should append to existing array", async () => {
            const token = contextToken<Array<number>>("items");
            await context.put(token, [1, 2]);

            await context.putPush(token, 3, 4);

            await expect(context.get(token)).resolves.toEqual([1, 2, 3, 4]);
        });

        test("Should handle single value", async () => {
            const token = contextToken<Array<string>>("items");

            await context.putPush(token, "hello");

            await expect(context.get(token)).resolves.toEqual(["hello"]);
        });
    });

    describe("method: update", () => {
        test("Should update value when token exists", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "old");

            await context.update(token, "new");

            await expect(context.get(token)).resolves.toBe("new");
        });

        test("Should not create value when token does not exist", async () => {
            const token = contextToken<string>("key");

            await context.update(token, "value");

            await expect(context.get(token)).resolves.toBeNull();
        });
    });

    describe("method: updateIncrement", () => {
        test("Should increment value when token exists", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 5);

            await context.updateIncrement(token);

            await expect(context.get(token)).resolves.toBe(6);
        });

        test("Should not change anything when token does not exist", async () => {
            const token = contextToken<number>("count");

            await context.updateIncrement(token);

            await expect(context.get(token)).resolves.toBeNull();
        });

        test("Should increment by specified nbr value", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 5);

            await context.updateIncrement(token, { nbr: 3 });

            await expect(context.get(token)).resolves.toBe(8);
        });

        test("Should not exceed max value", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 10);

            await context.updateIncrement(token, { max: 10 });

            await expect(context.get(token)).resolves.toBe(10);
        });

        test("Should cap incremented value to max when exceeding", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 8);

            await context.updateIncrement(token, { nbr: 5, max: 10 });

            await expect(context.get(token)).resolves.toBe(10);
        });

        test("Should increment with no max constraint when value exists", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 5);

            await context.updateIncrement(token, { nbr: 10 });

            await expect(context.get(token)).resolves.toBe(15);
        });
    });

    describe("method: updateDecrement", () => {
        test("Should decrement value when token exists", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 5);

            await context.updateDecrement(token);

            await expect(context.get(token)).resolves.toBe(4);
        });

        test("Should not change anything when token does not exist", async () => {
            const token = contextToken<number>("count");

            await context.updateDecrement(token);

            await expect(context.get(token)).resolves.toBeNull();
        });

        test("Should decrement by specified nbr value", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 10);

            await context.updateDecrement(token, { nbr: 3 });

            await expect(context.get(token)).resolves.toBe(7);
        });

        test("Should not go below min value", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 0);

            await context.updateDecrement(token, { min: 0 });

            await expect(context.get(token)).resolves.toBe(0);
        });

        test("Should decrement with no min constraint when value exists", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 5);

            await context.updateDecrement(token, { nbr: 10 });

            await expect(context.get(token)).resolves.toBe(-5);
        });
    });

    describe("method: updatePush", () => {
        test("Should append to existing array when token exists", async () => {
            const token = contextToken<Array<number>>("items");
            await context.put(token, [1, 2]);

            await context.updatePush(token, 3, 4);

            await expect(context.get(token)).resolves.toEqual([1, 2, 3, 4]);
        });

        test("Should not create array when token does not exist", async () => {
            const token = contextToken<Array<number>>("items");

            await context.updatePush(token, 1, 2);

            await expect(context.get(token)).resolves.toBeNull();
        });

        test("Should handle single value", async () => {
            const token = contextToken<Array<string>>("items");
            await context.put(token, ["existing"]);

            await context.updatePush(token, "new");

            await expect(context.get(token)).resolves.toEqual([
                "existing",
                "new",
            ]);
        });
    });

    describe("method: remove", () => {
        test("Should remove an existing value", async () => {
            const token = contextToken<string>("key");
            await context.put(token, "value");

            await context.remove(token);

            await expect(context.get(token)).resolves.toBeNull();
            await expect(context.exists(token)).resolves.toBe(false);
        });

        test("Should not throw when token does not exist", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(context.remove(token)).resolves.toBeUndefined();
        });

        test("Should remove only the specified token", async () => {
            const token1 = contextToken<string>("key1");
            const token2 = contextToken<string>("key2");
            await context.put(token1, "value1");
            await context.put(token2, "value2");

            await context.remove(token1);

            await expect(context.get(token1)).resolves.toBeNull();
            await expect(context.get(token2)).resolves.toBe("value2");
        });
    });

    describe("method: when", () => {
        test("Should invoke functions when condition is true", async () => {
            const token = contextToken<number>("value");

            await context.when(true, (ctx) => {
                return ctx.put(token, 42);
            });

            await expect(context.get(token)).resolves.toBe(42);
        });

        test("Should not invoke functions when condition is false", async () => {
            const token = contextToken<number>("value");

            await context.when(false, (ctx) => {
                return ctx.put(token, 42);
            });

            await expect(context.get(token)).resolves.toBeNull();
        });

        test("Should invoke multiple functions in order", async () => {
            const invocations: Array<number> = [];

            await context.when(
                true,
                (ctx) => {
                    invocations.push(1);
                    return ctx;
                },
                (ctx) => {
                    invocations.push(2);
                    return ctx;
                },
                (ctx) => {
                    invocations.push(3);
                    return ctx;
                },
            );

            expect(invocations).toEqual([1, 2, 3]);
        });

        test("Should support lazy conditions", async () => {
            const token = contextToken<number>("value");
            let conditionEvaluated = false;

            await context.when(
                () => {
                    conditionEvaluated = true;
                    return true;
                },
                (ctx) => ctx.put(token, 42),
            );

            expect(conditionEvaluated).toBe(true);
            await expect(context.get(token)).resolves.toBe(42);
        });

        test("Should support async lazy conditions", async () => {
            const token = contextToken<number>("value");

            await context.when(
                async () => {
                    await Promise.resolve();
                    return true;
                },
                (ctx) => ctx.put(token, 42),
            );

            await expect(context.get(token)).resolves.toBe(42);
        });

        test("Should not invoke functions when async condition is false", async () => {
            const token = contextToken<number>("value");

            await context.when(
                async () => {
                    await Promise.resolve();
                    return false;
                },
                (ctx) => ctx.put(token, 42),
            );

            await expect(context.get(token)).resolves.toBeNull();
        });

        test("Should pass context to each invocable", async () => {
            const token = contextToken<number>("count");
            await context.put(token, 0);

            await context.when(
                true,
                (ctx) => {
                    return ctx.update(token, 1);
                },
                (ctx) => {
                    return ctx.update(token, 2);
                },
            );

            await expect(context.get(token)).resolves.toBe(2);
        });

        test("Should return a chain that resolves with void", async () => {
            await expect(
                context.when(true, (ctx) => ctx),
            ).resolves.toBeUndefined();
        });
    });

    describe("chain: mutating methods", () => {
        test("Should apply chained operations in order", async () => {
            const token = contextToken<Array<number>>("items");

            await context.putPush(token, 1).putPush(token, 2).putPush(token, 3);

            await expect(context.get(token)).resolves.toEqual([1, 2, 3]);
        });

        test("Should resolve with void", async () => {
            const token = contextToken<string>("key");

            await expect(context.put(token, "value")).resolves.toBeUndefined();
        });

        test("Should support async lazy defaults on the chain", async () => {
            const token = contextToken<string>("nonexistent");

            await expect(
                context.put(token, "value").getOr(token, async () => {
                    await Promise.resolve();
                    return "lazy";
                }),
            ).resolves.toBe("value");
        });
    });

    describe("integration: method chaining", () => {
        test("Should support chaining multiple operations", async () => {
            const token1 = contextToken<string>("name");
            const token2 = contextToken<number>("count");
            const token3 = contextToken<Array<string>>("items");

            await context
                .put(token1, "test")
                .put(token2, 5)
                .putPush(token3, "a", "b")
                .update(token2, 10)
                .updatePush(token3, "c");

            await expect(context.get(token1)).resolves.toBe("test");
            await expect(context.get(token2)).resolves.toBe(10);
            await expect(context.get(token3)).resolves.toEqual(["a", "b", "c"]);
        });

        test("Should support complex workflows", async () => {
            const userCountToken = contextToken<number>("userCount");
            const activeUsersToken = contextToken<Array<string>>("activeUsers");

            await context
                .put(userCountToken, 0)
                .put(activeUsersToken, [])
                .when(true, (ctx) =>
                    ctx
                        .putIncrement(userCountToken)
                        .putPush(activeUsersToken, "user1"),
                )
                .when(
                    async () => {
                        await Promise.resolve();
                        return true;
                    },
                    (ctx) =>
                        ctx
                            .putIncrement(userCountToken)
                            .putPush(activeUsersToken, "user2"),
                );

            await expect(context.get(userCountToken)).resolves.toBe(2);
            await expect(context.get(activeUsersToken)).resolves.toEqual([
                "user1",
                "user2",
            ]);
        });
    });
});
