import { beforeEach, describe, expect, test } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import {
    contextToken,
    NotFoundExecutionContextError,
} from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/als-execution-context-adapter.js";
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
                token: ExecutionContext,
                factory: () => {
                    return new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    );
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            executionContext = new ProxyExecutionContext({
                container,
                executionContextToken: ExecutionContext,
            });

            await container.init();
        });

        test("Should delegate run and return its value:", () => {
            const result = executionContext.run(() => {
                return "result";
            });

            expect(result).toBe("result");
        });
        test("Should delegate reads and writes:", () => {
            const token = contextToken<string>("token");

            const result = executionContext.run(() => {
                executionContext.put(token, "value");
                return executionContext.get(token);
            });

            expect(result).toBe("value");
        });
        test("Should apply chained mutations to the same context:", () => {
            const name = contextToken<string>("name");
            const age = contextToken<number>("age");

            const result = executionContext.run(() => {
                executionContext.put(name, "John").put(age, 30);
                return [executionContext.get(name), executionContext.get(age)];
            });

            expect(result).toStrictEqual(["John", 30]);
        });
        test("Should delegate every mutation method:", () => {
            const count = contextToken<number>("count");
            const items = contextToken<Array<number>>("items");

            const result = executionContext.run(() => {
                executionContext
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
                    count: executionContext.get(count),
                    items: executionContext.get(items),
                };

                executionContext.remove(items);

                return {
                    values,
                    itemsAfterRemove: executionContext.get(items),
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
        test("Should delegate read checks and default values:", () => {
            const items = contextToken<Array<number>>("items");
            const missingToken = contextToken<string>("missingToken");

            const result = executionContext.run(() => {
                executionContext.putPush(items, 1, 2, 3);

                return {
                    contains: executionContext.contains(items, 2),
                    exists: executionContext.exists(items),
                    missing: executionContext.missing(missingToken),
                    getOr: executionContext.getOr(missingToken, "fallback"),
                };
            });

            expect(result).toStrictEqual({
                contains: true,
                exists: true,
                missing: true,
                getOr: "fallback",
            });
        });
        test("Should delegate getOrFail:", () => {
            executionContext.run(() => {
                expect(() =>
                    executionContext.getOrFail(
                        contextToken<string>("missingToken"),
                    ),
                ).toThrow(NotFoundExecutionContextError);
            });
        });
        test("Should delegate when:", () => {
            const token = contextToken<number>("token");

            const result = executionContext.run(() => {
                executionContext.put(token, 1);
                executionContext.when(true, (context) => {
                    return context.put(token, 5);
                });
                return executionContext.get(token);
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
                token: ExecutionContext,
                factory: () => {
                    return new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    );
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            executionContext = new ProxyExecutionContext({
                container,
                executionContextToken: ExecutionContext,
            });

            await container.init();
        });

        test("Should resolve the execution context inside the scope:", async () => {
            const token = contextToken<string>("token");

            const result = await container.run({
                scope: () => {
                    return executionContext.run(() => {
                        executionContext.put(token, "value");
                        return executionContext.get(token);
                    });
                },
            });

            expect(result).toBe("value");
        });
        test("Should not share context values between scopes:", async () => {
            const token = contextToken<string>("token");

            await container.run({
                scope: () => {
                    executionContext.run(() => {
                        executionContext.put(token, "value");
                    });
                },
            });

            const result = await container.run({
                scope: () => {
                    return executionContext.run(() => {
                        return executionContext.get(token);
                    });
                },
            });

            expect(result).toBe(null);
        });
    });
});
