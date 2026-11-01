import { beforeEach, describe, expect, test } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import {
    contextToken,
    NotFoundExecutionContextError,
} from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/als-execution-context-adapter.js";
import { AsyncExecutionContext } from "@/execution-context/implementations/derivables/async-execution-context/async-execution-context.js";
import { ProxyExecutionContext } from "@/execution-context/implementations/derivables/di/proxy-execution-context/proxy-execution-context.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/execution-context/execution-context.js";

describe("class: ProxyExecutionContext", () => {
    let container: Container;
    let executionContext: ProxyExecutionContext;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            container = new Container({
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });
            container.registerFactory({
                token: AsyncExecutionContext,
                factory: () => {
                    return new AsyncExecutionContext(
                        new AlsExecutionContextAdapter(),
                    );
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            executionContext = new ProxyExecutionContext({
                container,
                executionContextToken: AsyncExecutionContext,
            });

            await container.init();
        });

        test("Should delegate run and return its value:", async () => {
            const result = await executionContext.run(() => {
                return "result";
            });

            expect(result).toBe("result");
        });
        test("Should delegate reads and writes:", async () => {
            const token = contextToken<string>("token");

            const result = await executionContext.run(async () => {
                await executionContext.put(token, "value");
                return await executionContext.get(token);
            });

            expect(result).toBe("value");
        });
        test("Should apply chained mutations to the same context:", async () => {
            const name = contextToken<string>("name");
            const age = contextToken<number>("age");

            const result = await executionContext.run(async () => {
                await executionContext.put(name, "John").put(age, 30);
                return [
                    await executionContext.get(name),
                    await executionContext.get(age),
                ];
            });

            expect(result).toStrictEqual(["John", 30]);
        });
        test("Should delegate every mutation method:", async () => {
            const count = contextToken<number>("count");
            const items = contextToken<Array<number>>("items");

            const result = await executionContext.run(async () => {
                await executionContext
                    .put(count, 0)
                    .putIncrement(count)
                    .putIncrement(count, { nbr: 5 })
                    .putDecrement(count, { nbr: 2 })
                    .updateIncrement(count)
                    .updateDecrement(count)
                    .add(count, 100)
                    .update(count, 10)
                    .putPush(items, 1)
                    .putPush(items, 2, 3)
                    .updatePush(items, 4);

                const values = {
                    count: await executionContext.get(count),
                    items: await executionContext.get(items),
                };

                await executionContext.remove(items);

                return {
                    values,
                    itemsAfterRemove: await executionContext.get(items),
                };
            });

            expect(result).toStrictEqual({
                values: {
                    count: 10,
                    items: [1, 2, 3, 4],
                },
                itemsAfterRemove: null,
            });
        });
        test("Should delegate read checks and default values:", async () => {
            const items = contextToken<Array<number>>("items");
            const missingToken = contextToken<string>("missingToken");

            const result = await executionContext.run(async () => {
                await executionContext.putPush(items, 1, 2, 3);

                return {
                    contains: await executionContext.contains(items, 2),
                    exists: await executionContext.exists(items),
                    missing: await executionContext.missing(missingToken),
                    getOr: await executionContext.getOr(
                        missingToken,
                        "fallback",
                    ),
                };
            });

            expect(result).toStrictEqual({
                contains: true,
                exists: true,
                missing: true,
                getOr: "fallback",
            });
        });
        test("Should delegate getOrFail:", async () => {
            await executionContext.run(async () => {
                await expect(
                    executionContext.getOrFail(
                        contextToken<string>("missingToken"),
                    ),
                ).rejects.toThrow(NotFoundExecutionContextError);
            });
        });
        test("Should delegate when:", async () => {
            const token = contextToken<number>("token");

            const result = await executionContext.run(async () => {
                await executionContext.put(token, 1);
                await executionContext.when(true, (context) => {
                    return context.put(token, 5);
                });
                return await executionContext.get(token);
            });

            expect(result).toBe(5);
        });
    });

    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            container = new Container({
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });
            container.registerFactory({
                token: AsyncExecutionContext,
                factory: () => {
                    return new AsyncExecutionContext(
                        new AlsExecutionContextAdapter(),
                    );
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            executionContext = new ProxyExecutionContext({
                container,
                executionContextToken: AsyncExecutionContext,
            });

            await container.init();
        });

        test("Should resolve the execution context inside the scope:", async () => {
            const token = contextToken<string>("token");

            const result = await container.run({
                scope: async () => {
                    return await executionContext.run(async () => {
                        await executionContext.put(token, "value");
                        return await executionContext.get(token);
                    });
                },
            });

            expect(result).toBe("value");
        });
        test("Should not share context values between scopes:", async () => {
            const token = contextToken<string>("token");

            await container.run({
                scope: async () => {
                    await executionContext.run(async () => {
                        await executionContext.put(token, "value");
                    });
                },
            });

            const result = await container.run({
                scope: async () => {
                    return await executionContext.run(async () => {
                        return await executionContext.get(token);
                    });
                },
            });

            expect(result).toBe(null);
        });
    });
});
