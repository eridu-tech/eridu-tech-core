import { beforeEach, describe, expect, test, vi } from "vitest";

import { Concurrency } from "@/concurrency/implementations/derivables/_module-exports.js";
import { withTaskFactory } from "@/concurrency/implementations/middlewares/with-task-factory/with-task-factory.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";

describe("function: withTaskFactory", () => {
    const concurrency = new Concurrency(
        new ExecutionContext(new NoOpExecutionContextAdapter()),
    );

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call create with the invocable", async () => {
        const spy = vi.spyOn(Concurrency.prototype, "create");

        const withTask = withTaskFactory<[value: string]>(concurrency);

        async function fn(_value: string): Promise<void> {}
        const value = "value";
        await use(fn, withTask)(value);

        expect(spy).toHaveBeenCalledExactlyOnceWith(expect.any(Function));
    });
});
