import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/no-op-circuit-breaker-adapter/no-op-circuit-breaker-adapter.js";
import { CircuitBreakerFactoryResolver } from "@/circuit-breaker/implementations/derivables/_module-exports.js";
import { circuitBreakerFactoryResolverDiFactory } from "@/circuit-breaker/implementations/derivables/di/circuit-breaker-factory-resolver-di-factory/circuit-breaker-factory-resolver-di-factory.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

import type { Mock } from "vitest";

import type {
    ICircuitBreakerAdapter,
    ICircuitBreakerFactory,
    ICircuitBreakerFactoryResolver,
} from "@/circuit-breaker/contracts/_module-exports.js";

describe("function: circuitBreakerFactoryResolverDiFactory", () => {
    type Adapters = "adapter1" | "adapter2";
    let circuitBreakerFactory: ICircuitBreakerFactoryResolver<Adapters> &
        ICircuitBreakerFactory;
    let getState1: Mock<ICircuitBreakerAdapter["getState"]>;
    let getState2: Mock<ICircuitBreakerAdapter["getState"]>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const container = new Container({
            executionContext,
        });

        const adapter1 = new NoOpCircuitBreakerAdapter();
        getState1 = vi.spyOn(adapter1, "getState");

        const adapter2 = new NoOpCircuitBreakerAdapter();
        getState2 = vi.spyOn(adapter2, "getState");

        const circuitBreakerFactoryResolver =
            new CircuitBreakerFactoryResolver<Adapters>({
                adapters: {
                    adapter1,
                    adapter2,
                },
                defaultAdapter: "adapter1",
            });
        container.registerValue({
            token: CircuitBreakerFactoryResolver,
            value: circuitBreakerFactoryResolver,
        });
        circuitBreakerFactory =
            circuitBreakerFactoryResolverDiFactory<Adapters>(
                container,
                CircuitBreakerFactoryResolver,
            );

        await container.init();
    });

    test("Default adapter:", async () => {
        const key = "a";
        await circuitBreakerFactory.create(key).getState();

        const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

        expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
        expect(getState2).not.toHaveBeenCalled();
    });
    test("Adapter 1:", async () => {
        const key = "a";
        await circuitBreakerFactory.use("adapter1").create(key).getState();

        const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

        expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
        expect(getState2).not.toHaveBeenCalled();
    });
    test("Adapter 2:", async () => {
        const key = "a";
        await circuitBreakerFactory.use("adapter2").create(key).getState();

        const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

        expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
        expect(getState1).not.toHaveBeenCalled();
    });
});
